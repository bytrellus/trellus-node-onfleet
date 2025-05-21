import Bottleneck from "bottleneck";
import { LIMITER_DEFAULT_MAX_CONCURRENT, LIMITER_DEFAULT_MIN_TIME } from "./constants.js";
import { ValidationError } from "./errors.js";
import { Api } from "./resource.js";
import Administrators from "./resources/administrators.js";
import Containers from "./resources/containers.js";
import CustomFields from "./resources/customFields.js";
import Destinations from "./resources/destinations.js";
import Hubs from "./resources/hubs.js";
import Organization from "./resources/organization.js";
import Recipients from "./resources/recipients.js";
import RouteOptimizations from "./resources/routeOptimizations.js";
import RoutePlans from "./resources/routePlan.js";
import Tasks from "./resources/tasks.js";
import Teams from "./resources/teams.js";
import Webhooks from "./resources/webhooks.js";
import Workers from "./resources/workers.js";
import { authenticate, encode } from "./utils.js";

/** Options for configuring Bottleneck rate limiter */
export interface BottleneckOptions {
	/** Maximum concurrent requests (min 1, max 20) */
	maxConcurrent?: number;
	/** Minimum time between requests in ms (min 50) */
	minTime?: number;
}

/** Onfleet client configuration options */
export interface OnfleetOptions {
	/** Onfleet API key */
	apiKey: string;
	/** HTTP timeout in ms, must be <= DEFAULT_TIMEOUT */
	userTimeout?: number;
	/** Bottleneck rate-limiter settings */
	bottleneckOptions?: BottleneckOptions | null;
	/** Override base URL (default: https://onfleet.com) */
	baseURL?: string;
	/** Override default API path (default: /api) */
	defaultPath?: string;
	/** Override API version (default: /v2) */
	defaultApiVersion?: string;
}

const DEFAULT_URL = "https://onfleet.com";
const DEFAULT_PATH = "/api";
const DEFAULT_API_VERSION = "/v2";
const DEFAULT_TIMEOUT = 70000;

/** Main client class for Onfleet API */
export default class Onfleet {
	/** Shared Bottleneck limiter for all instances */
	public static limiter = new Bottleneck({
		maxConcurrent: LIMITER_DEFAULT_MAX_CONCURRENT,
		minTime: LIMITER_DEFAULT_MIN_TIME,
	});

	public administrators: Administrators;
	public admins: Administrators;
	public containers: Containers;
	public destinations: Destinations;
	public hubs: Hubs;
	public organization: Organization;
	public recipients: Recipients;
	public tasks: Tasks;
	public teams: Teams;
	public webhooks: Webhooks;
	public workers: Workers;
	public customFields: CustomFields;
	public routePlans: RoutePlans;
	public routeOptimizations: RouteOptimizations;

	/** Raw API configuration */
	private api: Api;
	private headers: Record<string, string> = {};

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
				"User-Agent": `trellus-node-onfleet`,
				Authorization: `Basic ${encode(apiKey)}`,
			},
		};

		if (bottleneckOptions) {
			this.initBottleneckOptions(bottleneckOptions);
		}

		// Instantiate all resources
		this.administrators = new Administrators(this.api);
		this.admins = this.administrators;
		this.containers = new Containers(this.api);
		this.customFields = new CustomFields(this.api);
		this.destinations = new Destinations(this.api);
		this.hubs = new Hubs(this.api);
		this.organization = new Organization(this.api);
		this.recipients = new Recipients(this.api);
		this.tasks = new Tasks(this.api);
		this.teams = new Teams(this.api);
		this.webhooks = new Webhooks(this.api);
		this.workers = new Workers(this.api);
		this.routePlans = new RoutePlans(this.api);
		this.routeOptimizations = new RouteOptimizations(this.api);
	}

	/** Override or add custom headers on the fly */
	public set customHeaders(headers: Record<string, string>) {
		this.headers = headers;
		this.api.headers = { ...this.api.headers, ...headers };
	}

	/** Current custom headers */
	public get customHeaders(): Record<string, string> {
		return this.headers;
	}

	/** Validate API key by pinging auth endpoint */
	public async verifyKey(): Promise<boolean> {
		return authenticate(this.api);
	}

	/** Configure Bottleneck rate-limiter settings */
	private initBottleneckOptions(opts: BottleneckOptions): void {
		const MAX_CONCURRENT_LIMIT = 20;
		const MIN_TIME_LIMIT = 50;

		if (
			opts.maxConcurrent !== undefined &&
			opts.maxConcurrent > 0 &&
			opts.maxConcurrent < MAX_CONCURRENT_LIMIT
		) {
			Onfleet.limiter.updateSettings({ maxConcurrent: opts.maxConcurrent });
		}
		if (opts.minTime !== undefined && opts.minTime > MIN_TIME_LIMIT) {
			Onfleet.limiter.updateSettings({ minTime: opts.minTime });
		}
	}
}
