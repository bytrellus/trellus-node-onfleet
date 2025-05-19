import { MatchMetadata, OnfleetMetadata } from "@/metadata.js";
import Resource, { Api } from "@/resource.js";
import { Location } from "@/resources/destinations.js";
import type { OnfleetTask } from "@/resources/tasks.js";

/**
 * Vehicle information for a worker
 */
export interface Vehicle {
	type: "BICYCLE" | "CAR" | "MOTORCYCLE" | "TRUCK";
	color?: string;
	description?: string;
	licensePlate?: string;
}

/**
 * Worker schedule entry
 */
export interface WorkerSchedule {
	date: string;
	timezone: string;
	shifts: [number, number][];
}

/**
 * Query parameters for fetching workers (list & single)
 */
export interface GetWorkerQueryProps {
	filter?: string;
	phones?: string;
	states?: string;
	teams?: string;
	analytics?: boolean;
	from?: number;
	to?: number;
}

/**
 * Parameters for fetching workers by location
 */
export interface GetWorkerByLocationProps extends Location {
	radius?: number;
}

/**
 * Properties for creating a new worker
 */
export interface CreateWorkerProps {
	name: string;
	phone: string;
	teams: string | string[];
	vehicle?: Vehicle;
	capacity?: number;
	displayName?: string;
}

/**
 * Properties for updating an existing worker
 */
export interface UpdateWorkerProps {
	capacity?: number;
	displayName?: string;
	name?: string;
	teams?: string | string[];
	vehicle?: Vehicle;
}

/**
 * Recurring schedule entries response
 */
export interface ScheduleEntries {
	entries: WorkerSchedule[];
}

/**
 * Shape of a worker object returned by Onfleet
 */
export interface OnfleetWorker {
	id: string;
	timeCreated: number;
	timeLastModified: number;
	organization: string;
	name: string;
	displayName: string;
	phone: string;
	activeTask: string | null;
	tasks: string[];
	onDuty: boolean;
	timeLastSeen: number;
	capacity: number;
	userData: {
		appVersion: string;
		batteryLevel: number;
		deviceDescription: string;
		platform: string;
	};
	accountStatus: string;
	metadata: OnfleetMetadata[];
	imageUrl: string | null;
	teams: string[];
	delayTime: number | null;
	location: Location;
	vehicle: Vehicle | null;
}

/**
 * Response for getByLocation
 */
export interface WorkersByLocationResult {
	workers: OnfleetWorker[];
}

/**
 * Query parameters for listing a worker's assigned tasks
 */
export interface GetWorkerTasksQueryProps {
	filter?: string;
	analytics?: boolean;
	from?: number;
	to?: number;
}

/**
 * Workers resource: CRUD, scheduling, metadata, and location operations
 */
export default class Workers extends Resource {
	/** Create a new worker */
	public create!: (props: CreateWorkerProps) => Promise<OnfleetWorker>;

	/** Delete a worker by ID */
	public deleteOne!: (id: string) => Promise<void>;

	/** Retrieve workers or a specific worker by ID */
	public get!: (
		id?: string,
		query?: GetWorkerQueryProps,
	) => Promise<OnfleetWorker | OnfleetWorker[]>;

	/** Retrieve workers near a location */
	public getByLocation!: (location: GetWorkerByLocationProps) => Promise<WorkersByLocationResult>;

	/** Get a worker's schedule */
	public getSchedule!: (id: string) => Promise<ScheduleEntries>;

	/** Set a worker's schedule */
	public setSchedule!: (id: string, schedule: ScheduleEntries) => Promise<ScheduleEntries>;

	/** List a worker's assigned tasks */
	public getTasks!: (id: string, query?: GetWorkerTasksQueryProps) => Promise<OnfleetTask[]>;

	/** Match metadata operations for workers */
	public matchMetadata!: MatchMetadata<OnfleetWorker["metadata"]>;

	/** Update an existing worker */
	public update!: (id: string, props: UpdateWorkerProps) => Promise<OnfleetWorker>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);

		this.endpoints({
			create: { path: "/workers", method: "POST" },
			get: {
				path: "/workers/:workerId",
				altPath: "/workers",
				method: "GET",
				queryParams: true,
			},
			getByLocation: {
				path: "/workers/location",
				method: "GET",
				queryParams: true,
			},
			getSchedule: {
				path: "/workers/:workerId/schedule",
				method: "GET",
			},
			setSchedule: {
				path: "/workers/:workerId/schedule",
				method: "POST",
			},
			getTasks: {
				path: "/workers/:workerId/tasks",
				method: "GET",
				queryParams: true,
			},
			matchMetadata: {
				path: "/workers/metadata",
				method: "POST",
			},
			update: {
				path: "/workers/:workerId",
				method: "PUT",
			},
			deleteOne: {
				path: "/workers/:workerId",
				method: "DELETE",
			},
		});
	}
}
