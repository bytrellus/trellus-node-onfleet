/* eslint-disable no-console */
import fetch from "node-fetch";
import { createError, HttpError, PermissionError, RateLimitError, ServiceError } from "./error.js";
import Onfleet from "./onfleet.js";
import * as util from "./util.js";

/**
 * The Method Factory
 * @desc configures the actual method for each CRUD operations
 * @returns a promise containing the response from an HTTP request
 */

const Methods = async (key, api, ...args) => {
	const { path, altPath, method, queryParams, deliveryManifestObject, timeoutInMilliseconds } =
		key;
	const operation = method; // Instead of using ['method'], we directly assign `method`
	let url = `${api.api.baseUrl}${path}`;
	let body = "";
	let hasBody = false;

	// No arguments
	if (args.length === 0 && operation === "GET" && altPath) {
		url = `${api.api.baseUrl}${altPath}`;
	}

	// 1 or more arguments
	if (args.length >= 1 && ["GET", "DELETE", "PUT"].includes(operation)) {
		if (["name", "shortId", "phone", "workers", "organizations", "teams"].includes(args[1])) {
			url = util.replaceWithEndpointAndParam(url, args[1], args[0]);
		} else if (util.isBase64Encoded(args[0])) {
			url = util.replaceWithId(url, args[0]);
		} else {
			url = `${api.api.baseUrl}${altPath}`;
		}

		if (operation === "PUT") {
			body = args[1];
			hasBody = true;
		}
	}
	if (
		["PUT", "DELETE"].includes(operation) &&
		url.includes("customFields") &&
		Array.isArray(args)
	) {
		body = args[0]; // eslint-disable-line
		hasBody = true;
	}
	// POST Prep - 3 different cases
	if (operation === "POST") {
		if (util.isBase64Encoded(args[0])) {
			url = util.replaceWithId(url, args[0]);
			if (args[1]) {
				body = args[1];
				hasBody = true;
			}
		} else {
			body = args[0];
			hasBody = true;
		}
	}

	// Query Params extension
	if (queryParams) {
		for (const element of args) {
			if (util.isQueryParam(element)) {
				url = util.appendQueryParameters(url, element);
			}
		}
	}

	// Reference https://docs.onfleet.com/reference/delivery-manifest
	if (deliveryManifestObject && args && args.length > 0) {
		args.forEach((item) => {
			if (item.hubId && item.workerId) {
				body = {
					path: `providers/manifest/generate?hubId=${item.hubId}&workerId=${item.workerId}`,
					method: "GET",
				};
				hasBody = true;
			}
			if (item.googleApiKey) {
				api.api.headers["X-API-Key"] = `Google ${item.googleApiKey}`;
			}
			if (item.startDate || item.endDate) {
				const queryParams = {};
				if (item.startDate) queryParams.startDate = item.startDate;
				if (item.endDate) queryParams.endDate = item.endDate;
				url = util.appendQueryParameters(url, queryParams);
			}
		});
	}

	// Send the HTTP request through the rate limiter
	try {
		const res = await Onfleet.limiter.schedule(() =>
			fetch(url, {
				method: operation,
				headers: api.api.headers,
				timeout: timeoutInMilliseconds,
				body: hasBody ? JSON.stringify(body) : undefined,
			}),
		);

		if (res.ok) {
			if (operation === "DELETE") {
				return res.status;
			}
			return res.json().catch(() => res.status);
		}

		const error = await res.json();
		const errorCode = error.message.error;
		console.log("fn error", error, errorCode);
		const errorInfo = [
			error.message.message,
			errorCode,
			error.message.cause,
			error.message.request,
		];

		if (errorCode === 2300) {
			throw RateLimitError(...errorInfo);
		} else if (errorCode >= 1100 && errorCode <= 1108) {
			throw PermissionError(...errorInfo);
		} else if (errorCode >= 2500) {
			throw ServiceError(...errorInfo);
		} else if (errorCode === 2218) {
			// Precondition error for Auto-Dispatch
			throw ServiceError(...errorInfo);
		}
		throw HttpError(...errorInfo);
	} catch (error) {
		throw createError("GenericError", "An error occurred");
	}
};

export default Methods;
