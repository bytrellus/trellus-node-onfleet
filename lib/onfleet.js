import Bottleneck from "bottleneck";
import packageData from "../package.json" assert { type: "json" };
import { LIMITER_DEFAULT_MAX_CONCURRENT, LIMITER_DEFAULT_MIN_TIME } from "./constants.js";
import { ValidationError } from "./error.js";
import Admins from "./resources/Administrators.js";
import Containers from "./resources/Containers.js";
import CustomFields from "./resources/CustomFields.js";
import Destinations from "./resources/Destinations.js";
import Hubs from "./resources/Hubs.js";
import Organization from "./resources/Organization.js";
import Recipients from "./resources/Recipients.js";
import Tasks from "./resources/Tasks.js";
import Teams from "./resources/Teams.js";
import Webhooks from "./resources/Webhooks.js";
import Workers from "./resources/Workers.js";
import { authenticate, encode } from "./util.js";

// Define constants for default values
const DEFAULT_URL = "https://onfleet.com";
const DEFAULT_PATH = "/api";
const DEFAULT_API_VERSION = "/v2";
const DEFAULT_TIMEOUT = 70000;

const { name, version } = packageData;

const resources = {
	Admins,
	Administrators: Admins,
	Containers,
	Destinations,
	Hubs,
	Organization,
	Recipients,
	Tasks,
	Teams,
	Workers,
	Webhooks,
	CustomFields,
};

/* The Onfleet constructor takes bottleneckOptions, but never sets them on the rate limiter. */
/* The bottleneckOptions are never validated. */
/* Rate limiter is being passed a parameter "waitUponDepletion" which is not a valid Bottleneck parameter. */
/* Errors being made with "new ErrorType" when all "ErrorType" are functions, not classes.
/ Leads to the thrown error actually being about how "ErrorType" is not a constructor rather than the intended error */
/* Rate limiter reservoir never gets refreshed if hitting the rate limit exactly.
/ Causes all requests to wait forever until library user's the application is restarted.
/ Actually hitting Onfleet's rate limit is an error response which causes the method to throw.
/ Given a function that loops, making request calls and only try/catches the entire loop,
/ the throwing of an error will stop the requests from being added to the limiter
/ such that the limiter's reservoir always gets depleted when the queue is empty, which does
/ not trigger a reserver reset due to the empty conditional in the depleted event handler. */
/* Having the reservoir update after each request doesn't work properly.
/ If multiple requests are made, the first one to come back will increase the reservoir
/ allowing more requests, which allows for the possibility of surpassing the rate limit */

class Onfleet {
	static limiter = new Bottleneck({
		maxConcurrent: LIMITER_DEFAULT_MAX_CONCURRENT,
		minTime: LIMITER_DEFAULT_MIN_TIME,
	});

	headers = {};

	constructor({
		apiKey,
		userTimeout = DEFAULT_TIMEOUT,
		bottleneckOptions = null,
		baseURL = DEFAULT_URL,
		defaultPath = DEFAULT_PATH,
		defaultApiVersion = DEFAULT_API_VERSION,
	}) {
		if (!apiKey) {
			throw ValidationError(
				"Onfleet API key not found, please obtain an API key from your organization admin",
			);
		}
		if (userTimeout > DEFAULT_TIMEOUT) {
			throw ValidationError(
				`User-defined timeout has to be shorter than ${DEFAULT_TIMEOUT}ms`,
			);
		}

		this.apiKey = apiKey;
		this.api = {
			baseUrl: `${baseURL}${defaultPath}${defaultApiVersion}`,
			timeout: userTimeout,
			headers: {
				"Content-Type": "application/json",
				"User-Agent": `${name}-${version}`,
				Authorization: `Basic ${encode(apiKey)}`,
			},
		};

		if (bottleneckOptions) {
			this.initBottleneckOptions(bottleneckOptions);
		}

		this.resources = resources;
		this.initResources();
	}

	get customHeaders() {
		return this.headers;
	}

	set customHeaders(headers) {
		this.headers = headers;
		this.api.headers = { ...this.api.headers, ...headers };
	}

	initBottleneckOptions(bottleneckOptions) {
		const LIMITER_HIGHEST_MAX_CONCURRENT = 20;
		const LIMITER_LOWEST_MIN_TIME = 50;

		if (bottleneckOptions.maxConcurrent) {
			let maxConcurrent = Number(bottleneckOptions.maxConcurrent);

			if (
				!isNaN(maxConcurrent) &&
				0 < maxConcurrent &&
				maxConcurrent < LIMITER_HIGHEST_MAX_CONCURRENT
			) {
				Onfleet.limiter.updateSettings({
					maxConcurrent: bottleneckOptions.maxConcurrent,
				});
			}
		}

		if (bottleneckOptions.minTime) {
			let minTime = Number(bottleneckOptions.minTime);

			if (!isNaN(minTime) && minTime > LIMITER_LOWEST_MIN_TIME) {
				Onfleet.limiter.updateSettings({
					minTime: bottleneckOptions.minTime,
				});
			}
		}
	}

	initResources() {
		Object.entries(resources).forEach(([name, Resource]) => {
			const endpoint = name.toLowerCase();
			this[endpoint] = new Resource(this);
		});
	}

	async verifyKey() {
		return await authenticate(this.api);
	}
}

export default Onfleet;
