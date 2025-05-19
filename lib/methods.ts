import { HttpError, PermissionError, RateLimitError, ServiceError } from "@/errors.js";
import Onfleet from "@/onfleet.js";
import type { Api } from "@/resource.js";
import * as util from "@/utils.js";
import fetch, { Response } from "node-fetch";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface MethodConfig {
	path: string;
	altPath?: string;
	method: HttpMethod;
	queryParams?: boolean;
	deliveryManifestObject?: boolean;
	timeoutInMilliseconds?: number | null;
}

export interface MethodFunction {
	(config: MethodConfig, api: Api, ...args: unknown[]): Promise<unknown>;
	timeoutInMilliseconds?: number | null;
}

/**
 * The Method Factory
 * @desc Configures and sends the HTTP request for each CRUD operation,
 *      applying rate limiting and error mapping.
 */
const Methods: MethodFunction = async (config, api, ...args): Promise<unknown> => {
	const {
		path,
		altPath,
		method: operation,
		queryParams,
		deliveryManifestObject,
		timeoutInMilliseconds,
	} = config;

	// Build URL and body based on args
	let url = `${api.baseUrl}${path}`;
	let body: unknown;
	let hasBody = false;

	// No args, GET with alternate path
	if (args.length === 0 && operation === "GET" && altPath) {
		url = `${api.baseUrl}${altPath}`;
	}

	// Handle GET/DELETE/PUT with id or param in args
	if (args.length >= 1 && ["GET", "DELETE", "PUT"].includes(operation)) {
		const [first, second] = args;
		if (
			typeof second === "string" &&
			["name", "shortId", "phone", "workers", "organizations", "teams"].includes(second)
		) {
			url = util.replaceWithEndpointAndParam(url, second, String(first));
		} else if (typeof first === "string" && util.isBase64Encoded(first)) {
			url = util.replaceWithId(url, first);
		} else if (altPath) {
			url = `${api.baseUrl}${altPath}`;
		}
		if (operation === "PUT") {
			body = second;
			hasBody = true;
		}
	}

	// Special-case customFields
	if (["PUT", "DELETE"].includes(operation) && url.includes("customFields") && args.length > 0) {
		body = args[0];
		hasBody = true;
	}

	// POST logic
	if (operation === "POST") {
		const [first, second] = args;
		if (typeof first === "string" && util.isBase64Encoded(first)) {
			url = util.replaceWithId(url, first);
			if (second !== undefined) {
				body = second;
				hasBody = true;
			}
		} else {
			body = first;
			hasBody = true;
		}
	}

	// Append query parameters
	if (queryParams) {
		for (const element of args) {
			if (util.isQueryParam(element)) {
				url = util.appendQueryParameters(url, element as Record<string, string>);
				// Don't override body with query params
			}
		}
	}

	// Delivery manifest support
	if (deliveryManifestObject && args.length > 0) {
		for (const item of args as any[]) {
			if (item?.hubId && item?.workerId) {
				body = {
					path: `providers/manifest/generate?hubId=${item.hubId}&workerId=${item.workerId}`,
					method: "GET",
				};
				hasBody = true;
			}
			if (item?.googleApiKey) {
				api.headers["X-API-Key"] = `Google ${item.googleApiKey}`;
			}
			if (item?.startDate || item?.endDate) {
				const qp: Record<string, string> = {};
				if (item.startDate) qp.startDate = String(item.startDate);
				if (item.endDate) qp.endDate = String(item.endDate);
				url = util.appendQueryParameters(url, qp);
			}
		}
	}

	// Prepare timeout via AbortController
	const controller = new AbortController();
	const timeoutMs = timeoutInMilliseconds ?? api.timeout;
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		// Schedule request through Bottleneck
		const response: Response = await Onfleet.limiter.schedule(() =>
			fetch(url, {
				method: operation,
				headers: api.headers,
				body: hasBody ? JSON.stringify(body) : undefined,
				signal: controller.signal,
			}),
		);

		// Rate-limit by HTTP 429
		if (response.status === 429) {
			throw new RateLimitError("Rate limit exceeded", response.status, undefined, { url });
		}

		if (response.ok) {
			if (operation === "DELETE") {
				return response.status;
			}

			const text = await response.text();
			if (!text) {
				return response.status;
			}

			try {
				return JSON.parse(text);
			} catch {
				return text;
			}
		}

		// Parse error payload
		let errPayload: any;
		try {
			errPayload = await response.json();
		} catch {
			throw new HttpError(response.statusText, response.status);
		}

		const err = errPayload.message || {};
		const code = err.error;
		const msg = err.message || response.statusText;
		const cause = err.cause;
		const reqInfo = err.request;

		if (code === 2300) {
			throw new RateLimitError(msg, code, cause, reqInfo);
		} else if (code >= 1100 && code <= 1108) {
			throw new PermissionError(msg, code, cause, reqInfo);
		} else if (code === 2218 || code >= 2500) {
			throw new ServiceError(msg, code, cause, reqInfo);
		}
		throw new HttpError(msg, code, cause, reqInfo);
	} catch (err: any) {
		if (err.name === "AbortError") {
			throw new HttpError("Request timed out", 408, err);
		}
		// Propagate custom errors
		throw err;
	} finally {
		// Always clear the timeout, regardless of success or failure
		clearTimeout(timeoutId);
	}
};

export default Methods;
