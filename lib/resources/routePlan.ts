import Resource, { Api } from "../resource.js";

/**
 * The RoutePlan object returned by Onfleet
 */
export interface OnfleetRoutePlan {
	id: string;
	name: string;
	state: "PENDING" | "IN_TRANSIT" | "COMPLETED" | string;
	color?: string;
	tasks: string[];
	organization: string;
	team: string | null;
	worker: string | null;
	vehicleType?: string;
	startAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	endAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	startingHubId?: string | null;
	endingHubId?: string | null;
	startTime: number;
	endTime?: number | null;
	timezone?: string;
	actualStartTime?: number | null;
	actualEndTime?: number | null;
	shortId: string;
	timeCreated: number;
	timeLastModified: number;
	taskStates?: number[];
}

/**
 * Props for creating a Route Plan
 */
export interface CreateRoutePlanProps {
	name: string;
	startTime: number;
	taskIds?: string[];
	color?: string;
	vehicleType?: string;
	worker?: string;
	team?: string;
	startAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	endAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	startingHubId?: string;
	endingHubId?: string;
	endTime?: number;
	timezone?: string;
}

/**
 * Props for updating a Route Plan
 */
export interface UpdateRoutePlanProps {
	name?: string;
	color?: string;
	vehicleType?: string;
	worker?: string;
	team?: string;
	startAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	endAt?: "HUB" | "WORKER_LOCATION" | "WORKER_ADDRESS" | null;
	startingHubId?: string;
	endingHubId?: string;
	startTime?: number;
	endTime?: number;
	timezone?: string;
}

/**
 * Props for adding or reordering tasks in a Route Plan
 */
export interface UpdateRoutePlanTasksProps {
	tasks: string[];
}

/**
 * Query parameters when listing Route Plans
 */
export interface GetRoutePlanQueryProps {
	workerId?: string;
	startTimeFrom?: number;
	startTimeTo?: number;
	createdTimeFrom?: number;
	createdTimeTo?: number;
	hasTasks?: boolean;
	limit?: number;
}

/**
 * RoutePlans resource: CRUD and task‐management on Route Plans
 */
export default class RoutePlans extends Resource {
	/** Create a new Route Plan */
	public create!: (props: CreateRoutePlanProps) => Promise<OnfleetRoutePlan>;

	/**
	 * Retrieve one or many Route Plans
	 * - `get(id)` → GET /routePlans/:routePlanId
	 * - `get(undefined, query)` → GET /routePlans?…
	 */
	public get!: (
		id?: string,
		query?: GetRoutePlanQueryProps,
	) => Promise<OnfleetRoutePlan | OnfleetRoutePlan[]>;

	/** Update an existing Route Plan */
	public update!: (id: string, props: UpdateRoutePlanProps) => Promise<OnfleetRoutePlan>;

	/** Delete a Route Plan by ID */
	public deleteOne!: (id: string) => Promise<void>;

	/** Add or reorder tasks in a Route Plan */
	public updateTasks!: (
		id: string,
		props: UpdateRoutePlanTasksProps,
	) => Promise<OnfleetRoutePlan>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/routePlans", method: "POST" },
			get: {
				path: "/routePlans/:routePlanId",
				altPath: "/routePlans",
				method: "GET",
				queryParams: true,
			},
			update: { path: "/routePlans/:routePlanId", method: "PUT" },
			deleteOne: { path: "/routePlans/:routePlanId", method: "DELETE" },
			updateTasks: { path: "/routePlans/:routePlanId/tasks", method: "PUT" },
		});
	}
}
