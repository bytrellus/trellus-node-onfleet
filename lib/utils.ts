import { Buffer } from "buffer";
import fetch from "node-fetch";
import { Api } from "./resource";

/**
 * Encoder for API key
 * @param apiKey - raw API key string
 * @returns base64-encoded API key
 */
export function encode(apiKey: string): string {
	const buff = Buffer.from(apiKey);
	return buff.toString("base64");
}

/**
 * Authentication checker, returns a boolean indicating if auth test endpoint succeeds
 * @param api - API client config
 */
export async function authenticate(api: Api): Promise<boolean> {
	const url = `${api.baseUrl}/auth/test`;
	try {
		const res = await fetch(url, {
			method: "GET",
			headers: api.headers,
		});
		return res.ok;
	} catch {
		return false;
	}
}

/**
 * Checks if a string is a Base64-encoded identifier (24 chars)
 * @param str - string to test
 */
export function isBase64Encoded(str: string): boolean {
	return str.length === 24 && /^[A-Za-z\d*~]{24}$/.test(str);
}

/**
 * Replace a ":<resource>Id" parameter in URL with the given id
 * @param url - URL template
 * @param id - resource identifier
 */
export function replaceWithId(url: string, id: string): string {
	return url.replace(/:[a-z]*Id/, id);
}

/**
 * For certain endpoints, remove the "/:param" segment, then replace trailing ":<param>Id" with "<endpoint>/<id>"
 * @param url - URL template
 * @param endpoint - resource endpoint name
 * @param id - resource identifier
 */
export function replaceWithEndpointAndParam(url: string, endpoint: string, id: string): string {
	let path = url;
	if (["workers", "teams", "organizations"].includes(endpoint)) {
		path = path.replace(/\/?:param/, "");
	}
	return path.replace(/:[a-z]*Id$/, `${endpoint}/${id}`);
}

/**
 * Appends query parameters to a URL
 * @param url - base URL
 * @param queryObj - key-value pairs for query string
 */
export function appendQueryParameters(url: string, queryObj: Record<string, string>): string {
	const params = new URLSearchParams(queryObj);
	return `${url}?${params.toString()}`;
}

/**
 * Checks if an object is suitable as query parameters
 * @param obj - value to test
 */
export function isQueryParam(obj: unknown): obj is Record<string, unknown> {
	return obj !== null && typeof obj === "object";
}

/**
 * Delays execution for the given milliseconds
 * @param ms - number of milliseconds to wait
 */
export function wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
