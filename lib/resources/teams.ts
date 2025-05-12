import Resource, { Api } from "../resource";
import { Location } from "./destinations";

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
 * Payload for inserting tasks into a team
 */
export interface InsertTaskProps {
	tasks: string[];
}

/**
 * Teams resource: CRUD, auto-dispatch, ETA, and task insertion
 */
export default class Teams extends Resource {
	public create!: (props: CreateTeamProps) => Promise<OnfleetTeam>;
	public get!: (id?: string) => Promise<OnfleetTeam | OnfleetTeam[]>;
	public update!: (id: string, props: UpdateTeamProps) => Promise<OnfleetTeam>;
	public deleteOne!: (id: string) => Promise<void>;
	public autoDispatch!: (
		id: string,
		props?: AutoDispatchTeamProps,
	) => Promise<AutoDispatchTeamResult>;
	public insertTask!: (id: string, props: InsertTaskProps) => Promise<OnfleetTeam>;
	public getWorkerEta!: (id: string, props?: GetWorkerETAProps) => Promise<GetWorkerEtaResult>;
	public getTasks!: (id: string) => Promise<any[]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/teams", method: "POST" },
			get: { path: "/teams/:teamId", altPath: "/teams", method: "GET" },
			update: { path: "/teams/:teamId", method: "PUT" },
			deleteOne: { path: "/teams/:teamId", method: "DELETE" },
			autoDispatch: { path: "/teams/:teamId/dispatch", method: "POST" },
			insertTask: { path: "/containers/teams/:teamId", method: "PUT" },
			getWorkerEta: { path: "/teams/:teamId/estimate", method: "GET", queryParams: true },
			getTasks: { path: "/teams/:teamId/tasks", method: "GET", queryParams: true },
		});
	}
}
