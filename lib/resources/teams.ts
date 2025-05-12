import Resource, { Api } from "../resource";
import { Location } from "./destinations";
import type { OnfleetTask } from "./tasks";

/**
 * Representation of an Onfleet Team
 */
export interface OnfleetTeam {
	hub: string;
	id: string;
	managers: string[];
	name: string;
	timeCreated: number;
	timeLastModified: number;
	workers: string[];
}

/**
 * Properties for creating a new team
 */
export interface CreateTeamProps {
	managers: string[];
	name: string;
	workers: string[];
	hub?: string;
}

/**
 * Properties for updating a team
 */
export interface UpdateTeamProps {
	managers?: string[];
	name?: string;
	workers?: string[];
	hub?: string;
}

/**
 * Options for auto-dispatching a team
 */
export interface AutoDispatchTeamProps {
	maxAllowedDelay?: number;
	maxTasksPerRoute?: number;
	routeEnd?: string;
	scheduleTimeWindow?: [number, number];
	serviceTime?: number;
	taskTimeWindow?: [number, number];
}

/**
 * Result of an auto-dispatch operation
 */
export interface AutoDispatchTeamResult {
	dispatchId: string;
}

/**
 * Parameters for retrieving worker ETA
 */
export interface GetWorkerETAProps {
	dropoffLocation?: string;
	pickupLocation?: string;
	pickupTime?: number;
	restrictedVehicleTypes?: "BICYCLE" | "CAR" | "MOTORCYCLE" | "TRUCK";
	serviceTime?: number;
}

/**
 * Steps in a navigation route
 */
export interface NavigationStep {
	arrivalTime: number;
	completionTime: number;
	distance: number;
	location: Location;
	serviceTime: number;
	travelTime: number;
}

/**
 * Response for worker ETA queries
 */
export interface GetWorkerEtaResult {
	workerId: string;
	vehicle: "BICYCLE" | "CAR" | "MOTORCYCLE" | "TRUCK";
	steps: NavigationStep[];
}

/**
 * Query parameters for listing unassigned tasks in a team
 */
export interface TeamTasksQueryProps {
	isPickupTask?: boolean;
	to?: number;
	from?: number;
	lastId?: string;
}

/**
 * Result for listing unassigned tasks in a team
 */
export interface TeamTasksResult {
	tasks: OnfleetTask[];
	lastId?: string;
}

/**
 * Teams resource: CRUD, auto-dispatch, ETA, and unassigned task listing
 */
export default class Teams extends Resource {
	/** Create a new team */
	public create!: (props: CreateTeamProps) => Promise<OnfleetTeam>;

	/**
	 * Retrieve one team by ID, or list all teams
	 * - `get(id)` → GET /teams/:teamId
	 * - `get()`    → GET /teams
	 */
	public get!: (id?: string) => Promise<OnfleetTeam | OnfleetTeam[]>;

	/** Update a team by ID */
	public update!: (id: string, props: UpdateTeamProps) => Promise<OnfleetTeam>;

	/** Delete a team by ID */
	public deleteOne!: (id: string) => Promise<void>;

	/** Auto-dispatch a team */
	public autoDispatch!: (
		id: string,
		props?: AutoDispatchTeamProps,
	) => Promise<AutoDispatchTeamResult>;

	/** Get worker ETA for a team */
	public getWorkerEta!: (id: string, props?: GetWorkerETAProps) => Promise<GetWorkerEtaResult>;

	/** List unassigned tasks in a team */
	public getTasks!: (id: string, query?: TeamTasksQueryProps) => Promise<TeamTasksResult>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/teams", method: "POST" },
			get: { path: "/teams/:teamId", altPath: "/teams", method: "GET" },
			update: { path: "/teams/:teamId", method: "PUT" },
			deleteOne: { path: "/teams/:teamId", method: "DELETE" },
			autoDispatch: { path: "/teams/:teamId/dispatch", method: "POST" },
			getWorkerEta: { path: "/teams/:teamId/estimate", method: "GET", queryParams: true },
			getTasks: { path: "/teams/:teamId/tasks", method: "GET", queryParams: true },
		});
	}
}
