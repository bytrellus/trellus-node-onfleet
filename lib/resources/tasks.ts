import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";
import { CreateDestinationProps, Location, OnfleetDestination } from "../resources/destinations.js";
import { CreateRecipientProps, OnfleetRecipient } from "../resources/recipients.js";

/** Keys for querying tasks (only “shortId” in this case) */
export type TaskQueryKey = "shortId";

/** Possible task states */
export enum TaskState {
	Unassigned,
	Assigned,
	Active,
	Completed,
}

/** Value types for custom fields */
export type TaskCustomFieldValue = boolean | number | string | string[];

/** Definition of a custom field on a task */
export interface TaskCustomField {
	key: string;
	value: TaskCustomFieldValue;
}

/** Simplified completion event */
export interface CompletionEvent {
	name: string;
	time: number;
	location?: Location;
}

/** Requirements before completing a task */
export interface TaskCompletionRequirements {
	signature?: boolean;
	notes?: boolean;
	photo?: boolean;
	minimumAge?: number;
}

/** Details for task completion */
export interface TaskCompletionDetails {
	failureNotes?: string;
	failureReason?: string;
	events: CompletionEvent[];
	actions?: any[];
	time: number | null;
	firstLocation?: Location;
	lastLocation?: Location;
	unavailableAttachments?: any[];
	photoUploadIds?: string[];
	signatureUploadId?: string | null;
	notes?: string;
	success?: boolean;
}

/** Barcode definitions */
export interface Barcode {
	blockCompletion?: boolean;
	data?: string;
}

export interface CapturedBarcode {
	id: string;
	symbology: string;
	data: string;
	location: Location;
	time: number;
	wasRequested: boolean;
}

/** Containers for tasks */
export type TaskContainer =
	| { type: "WORKER"; worker: string }
	| { type: "ORGANIZATION"; organization: string }
	| { type: "TEAM"; team: string };

/** Full OnfleetTask shape */
export interface OnfleetTask {
	id: string;
	state: TaskState;
	creator: string;
	organization: string;
	executor: string;
	container: TaskContainer;

	destination: string | OnfleetDestination;
	recipients: Array<OnfleetRecipient | string>;
	metadata: OnfleetMetadata[];
	notes?: string;

	completeAfter?: number;
	completeBefore?: number;
	pickupTask: boolean;
	quantity: number;
	serviceTime?: number;

	appearance?: any;
	dependencies?: string[];
	didAutoAssign?: boolean;
	feedback?: any[];

	identity?: {
		failedScanCount: number;
		checksum: null;
	};
	merchant?: string;
	shortId?: string;

	overrides?: {
		recipientName?: string | null;
		recipientNotes?: string | null;
		recipientSkipSMSNotifications?: boolean;
		useMerchantForProxy?: string | null;
	};

	timeCreated: number;
	timeLastModified?: number;
	trackingURL?: string;
	trackingViewed?: boolean;
	worker?: string | null;

	requirements?: TaskCompletionRequirements;

	completionDetails: TaskCompletionDetails;

	barcodes?: {
		required: Barcode[];
		captured: CapturedBarcode[];
	};

	customFields?: TaskCustomField[];
}

/** Props for creating a single task */
export interface CreateTaskProps {
	destination: string | CreateDestinationProps;
	recipients: string[] | CreateRecipientProps[];
	autoAssign?: Omit<TaskAutoAssignOptions, "teams" | "restrictAutoAssignmentToTeam">;
	capacity?: number;
	container?: TaskContainer;
	completeAfter?: number;
	completeBefore?: number;
	dependencies?: string[];
	executor?: string;
	metadata?: OnfleetMetadata[];
	merchant?: string;
	notes?: string;
	pickupTask?: boolean;
	quantity?: number;
	recipientName?: string;
	recipientNotes?: string;
	recipientSkipSMSNotifications?: boolean;
	requirements?: TaskCompletionRequirements;
	barcodes?: Barcode[];
	serviceTime?: number;
	customFields?: TaskCustomField[];
}

/** Props for batch task creation */
export interface CreateMultipleTasksProps {
	tasks: CreateTaskProps[];
}

/** Result of batch creation (synchronous) */
export interface CreateMultipleTasksResult {
	tasks: OnfleetTask[];
}

/** Result of batch creation (async) */
export interface CreateAsyncMultipleTaskResult {
	status: string;
	jobId: string;
}

/** Single‐task GET adds ETA fields */
export interface GetTaskResult extends OnfleetTask {
	eta: number | null;
	estimatedCompletionTime: number | null;
}

/** Multi‐task GET response */
export interface GetManyTaskResult {
	lastId?: string;
	tasks: GetTaskResult[];
}

/** Update returns these fields */
export interface UpdateTaskResult extends OnfleetTask {
	eta: number;
	estimatedArrivalTime: number | null;
	estimatedCompletionTime: number | null;
}

/** Automatically‐assign props/result */
export interface AutomaticallyAssignTaskProps {
	tasks: string[];
	options?: TaskAutoAssignOptions;
}
export interface AutomaticallyAssignTaskResult {
	assignedTasksCount: number;
	assignedTasks: Record<string, string>;
}

/** Options for auto-assigning tasks */
export interface TaskAutoAssignOptions {
	mode: string;
	considerDependencies?: boolean;
	excludedWorkerIds?: string[];
	maxAssignedTaskCount?: number;
	team?: string;
	teams?: string[];
	restrictAutoAssignmentToTeam?: boolean;
}

/**
 * Tasks resource: comprehensive CRUD, batch, clone, shortId lookup,
 * auto‐assign and metadata operations
 */
export default class Tasks extends Resource {
	/** Create a single task */
	public create!: (props: CreateTaskProps) => Promise<OnfleetTask>;

	/** Batch‐create tasks (deprecated) */
	public batchCreate!: (props: CreateMultipleTasksProps) => Promise<CreateMultipleTasksResult>;

	/** Batch‐create tasks asynchronously */
	public batchCreateAsync!: (
		props: CreateMultipleTasksProps,
	) => Promise<CreateAsyncMultipleTaskResult>;

	/** Check status of an async batch job */
	public getBatch!: (jobId: string) => Promise<{ status: string; jobId: string }>;

	/**
	 * GET single task by ID, or list tasks (/tasks/all?…)
	 *
	 * Usage:
	 * - `tasks.get("someTaskId")` → GET /tasks/someTaskId
	 * - `tasks.get(undefined, { from, to, state, worker, … })` → GET /tasks/all?…
	 */
	public get!: (
		idOrNothing?: string,
		keyOrParams?: TaskQueryKey | Partial<Record<string, any>>,
	) => Promise<OnfleetTask | GetManyTaskResult>;

	/** Retrieve a task by its short ID */
	public getByShortId!: (shortId: string) => Promise<OnfleetTask>;

	/** Update a task */
	public update!: (id: string, props: Partial<CreateTaskProps>) => Promise<UpdateTaskResult>;

	/** Force‐complete a task */
	public forceComplete!: (
		id: string,
		details: { completionDetails: { success: boolean; notes?: string } },
	) => Promise<void>;

	/** Clone a task */
	public clone!: (id: string) => Promise<OnfleetTask>;

	/** Delete a task (returns number of deleted records) */
	public deleteOne!: (id: string) => Promise<number>;

	/** Automatically assign tasks */
	public autoAssign!: (
		props: AutomaticallyAssignTaskProps,
	) => Promise<AutomaticallyAssignTaskResult>;

	/** Metadata operations */
	public matchMetadata!: MatchMetadata<OnfleetTask["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/tasks", method: "POST" },
			batchCreate: { path: "/tasks/batch", method: "POST" },
			batchCreateAsync: { path: "/tasks/batch-async", method: "POST" },
			getBatch: { path: "/tasks/batch/:batchId", method: "GET" },
			get: {
				path: "/tasks/:taskId",
				altPath: "/tasks/all",
				method: "GET",
				queryParams: true,
			},
			getByShortId: { path: "/tasks/shortId/:taskId", method: "GET" },
			update: { path: "/tasks/:taskId", method: "PUT" },
			forceComplete: { path: "/tasks/:taskId/complete", method: "POST" },
			clone: { path: "/tasks/:taskId/clone", method: "POST" },
			deleteOne: { path: "/tasks/:taskId", method: "DELETE" },
			autoAssign: { path: "/tasks/autoAssign", method: "POST" },
			matchMetadata: { path: "/tasks/metadata", method: "POST" },
		});
	}
}
