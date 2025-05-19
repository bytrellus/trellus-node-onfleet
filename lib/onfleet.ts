import { LIMITER_DEFAULT_MAX_CONCURRENT, LIMITER_DEFAULT_MIN_TIME } from "@/constants.js";
import { ValidationError } from "@/errors.js";
import { Api } from "@/resource.js";
import Admins from "@/resources/administrators.js";
import Containers from "@/resources/containers.js";
import CustomFields from "@/resources/customFields.js";
import Destinations from "@/resources/destinations.js";
import Hubs from "@/resources/hubs.js";
import Organization from "@/resources/organization.js";
import Recipients from "@/resources/recipients.js";
import RouteOptimizations from "@/resources/routeOptimizations.js";
import RoutePlans from "@/resources/routePlan.js";
import Tasks from "@/resources/tasks.js";
import Teams from "@/resources/teams.js";
import Webhooks from "@/resources/webhooks.js";
import Workers from "@/resources/workers.js";
import { authenticate, encode } from "@/utils.js";
import Bottleneck from "bottleneck";
import packageData from "../package.json" with { type: "json" };

/** Options for configuring Bottleneck rate limiter */
export interface BottleneckOptions {
	maxConcurrent?: number;
	minTime?: number;
}

/**
 * Constructor options for Onfleet client
 */
export interface OnfleetOptions {
	apiKey: string;
	userTimeout?: number;
	bottleneckOptions?: BottleneckOptions | null;
	baseURL?: string;
	defaultPath?: string;
	defaultApiVersion?: string;
}

const DEFAULT_URL = "https://onfleet.com";
const DEFAULT_PATH = "/api";
const DEFAULT_API_VERSION = "/v2";
const DEFAULT_TIMEOUT = 70000;
const { name, version } = packageData;

// Map of resource constructors
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
	Webhooks,
	CustomFields,
	Workers,
	RoutePlans,
	RouteOptimizations,
} as const;

/**
 * Main client class for Onfleet API
 */
export default class Onfleet {
	// Shared rate limiter for all instances
	public static limiter = new Bottleneck({
		maxConcurrent: LIMITER_DEFAULT_MAX_CONCURRENT,
		minTime: LIMITER_DEFAULT_MIN_TIME,
	});

	private api: Api;
	private headers: Record<string, string> = {};
	[key: string]: any;

	constructor({
		apiKey,
		userTimeout = DEFAULT_TIMEOUT,
		bottleneckOptions = null,
		baseURL = DEFAULT_URL,
		defaultPath = DEFAULT_PATH,
		defaultApiVersion = DEFAULT_API_VERSION,
	}: OnfleetOptions) {
		if (!apiKey) {
			throw new ValidationError(
				"Onfleet API key not found, please obtain an API key from your organization admin",
			);
		}
		if (userTimeout > DEFAULT_TIMEOUT) {
			throw new ValidationError(
				`User-defined timeout must be shorter than ${DEFAULT_TIMEOUT}ms`,
			);
		}

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

		this.initResources();
	}

	/** Current custom headers added to requests */
	public get customHeaders(): Record<string, string> {
		return this.headers;
	}

	/** Override or add custom headers on the fly */
	public set customHeaders(headers: Record<string, string>) {
		this.headers = headers;
		this.api.headers = { ...this.api.headers, ...headers };
	}

	/** Configure Bottleneck rate-limiter settings */
	private initBottleneckOptions(opts: BottleneckOptions): void {
		const LIMITER_HIGHEST_MAX_CONCURRENT = 20;
		const LIMITER_LOWEST_MIN_TIME = 50;

		if (opts.maxConcurrent !== undefined) {
			const mc = Number(opts.maxConcurrent);
			if (!Number.isNaN(mc) && mc > 0 && mc < LIMITER_HIGHEST_MAX_CONCURRENT) {
				Onfleet.limiter.updateSettings({ maxConcurrent: mc });
			}
		}
		if (opts.minTime !== undefined) {
			const mt = Number(opts.minTime);
			if (!Number.isNaN(mt) && mt > LIMITER_LOWEST_MIN_TIME) {
				Onfleet.limiter.updateSettings({ minTime: mt });
			}
		}
	}

	/** Instantiate all resource clients on this instance */
	private initResources(): void {
		for (const [name, ResourceClass] of Object.entries(resources)) {
			const endpoint = name.toLowerCase();
			this[endpoint] = new ResourceClass(this.api);
		}
	}

	/** Validate API key by pinging auth endpoint */
	public async verifyKey(): Promise<boolean> {
		return authenticate(this.api);
	}
}
