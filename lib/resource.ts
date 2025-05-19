import methods from "@/methods.js";

/**
 * Defines the shape of the API client used by each resource
 */
export interface Api {
	baseUrl: string;
	timeout: number;
	headers: Record<string, string>;
}

/**
 * Resource class initiates all CRUD operations
 */
export default class Resource {
	private api: Api;
	private timeoutInMilliseconds: number | null;
	[key: string]: any;

	constructor(api: Api) {
		this.api = api;
		this.timeoutInMilliseconds = null;
	}

	/**
	 * Defines the timeout value for subsequent endpoint methods.
	 * If none is specified, uses the default API timeout.
	 */
	public defineTimeout(timeout: number | null): void {
		this.timeoutInMilliseconds = timeout ?? this.api.timeout;
	}

	/**
	 * Initializes all the methods defined in each resource configuration.
	 * @param params Configuration object mapping endpoint names to method configs.
	 */
	public endpoints(params: Record<string, any>): void {
		for (const endpointName in params) {
			if (!Object.prototype.hasOwnProperty.call(params, endpointName)) {
				continue;
			}

			const endpointConfig = params[endpointName];
			const methodFunction = (...args: unknown[]): Promise<any> =>
				methods(endpointConfig, this.api, ...args);

			methodFunction.timeoutInMilliseconds = this.timeoutInMilliseconds;

			this[endpointName] = methodFunction;
		}
	}
}
