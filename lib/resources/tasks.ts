import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";
import { CreateDestinationProps, Location, OnfleetDestination } from "../resources/destinations.js";
import { CreateRecipientProps, OnfleetRecipient } from "../resources/recipients.js";

/** Keys for querying tasks (only “shortId” in this case) */
export type TaskQueryKey = "shortId";

/** Possible task states */
export enum TaskState {
	/** Unassigned: task has not yet been assigned to a worker. */
	Unassigned = 0,
	/** Assigned: task has been assigned to a worker. */
	Assigned = 1,
	/** Active: task has been started by its assigned worker. */
	Active = 2,
	/** Completed: task has been completed by its assigned worker. */
	Completed = 3,
}

/** Value types for custom fields */
export type TaskCustomFieldValue = boolean | number | string | string[];

/** Definition of a custom field on a task */
export interface TaskCustomField {
	/** Unique identifier for this custom field. */
	key: string;
	/** The desired value for this field. */
	value: TaskCustomFieldValue;
}

/** Simplified completion event */
export interface CompletionEvent {
	/** Event name (e.g. "ARRIVAL", "DEPARTURE"). */
	name: string;
	/** Timestamp in Unix ms. */
	time: number;
	/** Optional geographic location for the event. */
	location?: Location;
}

/** Requirements before completing a task */
export interface TaskCompletionRequirements {
	/** Require a signature. */
	signature?: boolean;
	/** Require a photo. */
	photo?: boolean;
	/** Require notes. */
	notes?: boolean;
	/** Require recipient’s age ≥ this (ID verification). */
	minimumAge?: number;
}

/** Details recorded when force-completing a task */
export interface TaskCompletionDetails {
	/** Notes (empty string if none). */
	notes: string;
	/** Notes when it failed (empty string if none). */
	failureNotes: string;
	/** Notes when it succeeded (empty string if none). */
	successNotes: string;
	/** “NONE” or other failure reason code. */
	failureReason: string;
	/** Collected events */
	events: CompletionEvent[];
	/** Any actions taken */
	actions: any[];
	/** Timestamp (ms) when completion occurred, or null if not done. */
	time: number | null;
	/** Signature upload ID, or null if not provided. */
	signatureUploadId: string | null;
	/** Single-photo upload ID, or null if not provided. */
	photoUploadId: string | null;
	/** Multi-photo upload IDs, or null if not provided. */
	photoUploadIds: string[] | null;
	/** First recorded location coords, or empty array. */
	firstLocation: number[];
	/** Last recorded location coords, or empty array. */
	lastLocation: number[];
	/** Any attachments that couldn't be retrieved. */
	unavailableAttachments: any[];
}

/** Definition for a barcode requirement */
export interface Barcode {
	/** Block non-required scans. */
	blockCompletion?: boolean;
	/** Data string to match against scans. */
	data?: string;
}

/** A barcode actually captured at completion */
export interface CapturedBarcode {
	/** Unique scan ID. */
	id: string;
	/** Symbology identifier (e.g. "CODE128"). */
	symbology: string;
	/** Data captured from the scan. */
	data: string;
	/** Geographic location of the scan. */
	location: Location;
	/** Timestamp in Unix ms when scan occurred. */
	time: number;
	/** Whether this barcode was requested. */
	wasRequested: boolean;
}

/** Appearance options for map pins */
export interface Appearance {
	/** Triangle color: 0=teal, 1=orange, 2=magenta */
	triangleColor: 0 | 1 | 2;
}

/** Container types a task may live in */
export type TaskContainer =
	| { type: "WORKER"; worker: string }
	| { type: "ORGANIZATION"; organization: string }
	| { type: "TEAM"; team: string };

/** The full Task object returned by the API */
export interface OnfleetTask {
	/** Unique task ID. */
	id: string;
	/** Numeric state code. */
	state: TaskState;
	/** ID of the user or process who created the task. */
	creator: string;
	/** Owning organization ID. */
	organization: string;
	/** Executor (responsible) organization ID. */
	executor: string;
	/** Container holding this task (org, team or worker). */
	container: TaskContainer;

	/** Destination ID or embedded destination object. */
	destination: string | OnfleetDestination;
	/** Recipient IDs or embedded recipient objects. */
	recipients: Array<OnfleetRecipient | string>;
	/** Free-form metadata attached to this task. */
	metadata: OnfleetMetadata[];
	/** Optional notes describing the task. */
	notes?: string;

	/** Earliest allowed completion timestamp (ms since epoch). */
	completeAfter?: number;
	/** Latest allowed completion timestamp (ms since epoch). */
	completeBefore?: number;
	/** True for pickup tasks, false for drop-off tasks. */
	pickupTask: boolean;
	/** Quantity of units to pick up or drop off (routing). */
	quantity: number;
	/** Service time in minutes on-site (routing). */
	serviceTime?: number;

	/** Visual pin options for maps. */
	appearance?: Appearance;
	/** IDs of tasks that must finish before this one. */
	dependencies?: string[];
	/** True if auto-assign succeeded. */
	didAutoAssign?: boolean;
	/** Any feedback provided by recipients. */
	feedback?: any[];
	/** Route plan ID, if part of a route. */
	routePlan?: string;

	/** Overridden merchant org ID, if any. */
	merchant?: string;
	/** Human-friendly short task ID. */
	shortId?: string;
	/** URL for live-tracking this task. */
	trackingURL?: string;
	/** Whether the tracking page has been viewed. */
	trackingViewed?: boolean;
	/** Assigned worker ID, or null if unassigned. */
	worker?: string | null;

	/** Creation timestamp (ms since epoch). */
	timeCreated: number;
	/** Last modification timestamp (ms since epoch). */
	timeLastModified?: number;

	/** Completion requirements (signature, photo, notes, age). */
	requirements?: TaskCompletionRequirements;
	/** Actual completion details recorded on force complete. */
	completionDetails: TaskCompletionDetails;

	/** Barcode requirements and captures. */
	barcodes?: {
		required: Barcode[];
		captured: CapturedBarcode[];
	};

	/** Custom fields attached to this task. */
	customFields?: TaskCustomField[];
}

/** Parameters for creating a single task */
export interface CreateTaskProps {
	/** Destination ID or full object to auto-create. */
	destination: string | CreateDestinationProps;
	/** Recipient IDs or full objects to auto-create. */
	recipients: string[] | CreateRecipientProps[];
	/** Merchant org ID to show in notifications. */
	merchant?: string;
	/** Executor org ID for fulfillment. */
	executor?: string;
	/** Earliest completion timestamp (ms). */
	completeAfter?: number;
	/** Latest completion timestamp (ms). */
	completeBefore?: number;
	/** True = pickup; false = drop-off. */
	pickupTask?: boolean;
	/** Notes (maximum 10,000 characters). */
	notes?: string;
	/** Automatic assignment options (omit team restrictions). */
	autoAssign?: Omit<TaskAutoAssignOptions, "teams" | "restrictAutoAssignmentToTeam">;
	/** Custom container for the task (org, team or worker). */
	container?: TaskContainer;
	/** IDs of tasks to complete before this one. */
	dependencies?: string[];
	/** Quantity of units for routing purposes. */
	quantity?: number;
	/** On-site time in minutes for routing. */
	serviceTime?: number;
	/** Override recipient name for this task only. */
	recipientName?: string;
	/** Override recipient notes for this task only. */
	recipientNotes?: string;
	/** Override whether to skip SMS notifications for this recipient on this task only. */
	recipientSkipSMSNotifications?: boolean;
	/** Use merchant org ID for proxy notifications on this task only. */
	useMerchantForProxy?: boolean;
	/** Set signature/photo/notes/age completion requirements. */
	requirements?: TaskCompletionRequirements;
	/** Block scanning of non-required barcodes. */
	scanOnlyRequiredBarcodes?: boolean;
	/** Barcode requirements array. */
	barcodes?: Barcode[];
	/** Visual pin appearance settings. */
	appearance?: Appearance;
	/** Custom fields to attach. */
	customFields?: TaskCustomField[];
	/** Arbitrary metadata to attach. */
	metadata?: OnfleetMetadata[];
}

/** Properties for updating an existing task */
export interface UpdateTaskProps {
	/** Free-form notes (max 10,000 chars). */
	notes?: string;
	/** Arbitrary metadata (will overwrite existing). */
	metadata?: OnfleetMetadata[];
	/** Move this task into a different container. */
	container?: TaskContainer;
	/** Destination ID of an already-updated Destination object. */
	destination?: string;
	/** Earliest completion timestamp (ms since epoch). */
	completeAfter?: number;
	/** Latest completion timestamp (ms since epoch). */
	completeBefore?: number;
}

/** Properties for force-completing an active task */
export interface ForceCompleteTaskProps {
	/** Object specifying completion status and notes. */
	completionDetails: {
		/** Whether the task's completion was successful. */
		success: boolean;
		/** Optional completion notes. */
		notes?: string;
	};
}

export interface ListTasksParams {
	from: number;
	to?: number;
	lastId?: string;
	state?: string;
	worker?: string;
	completeBefore?: number;
	completeAfter?: number;
	dependencies?: string;
	containers?: string;
}

/** Batch-create (sync) parameters */
export interface CreateMultipleTasksProps {
	tasks: CreateTaskProps[];
}
/** Sync batch-create result */
export interface CreateMultipleTasksResult {
	tasks: OnfleetTask[];
}
/** Async batch-create result */
export interface CreateAsyncMultipleTaskResult {
	status: string;
	jobId: string;
}

/** GET-single adds ETA fields */
export interface GetTaskResult extends OnfleetTask {
	/** Estimated arrival (ms). */
	eta: number | null;
	/** Estimated completion (ms). */
	estimatedCompletionTime: number | null;
}
/** GET-many (list) response */
export interface GetManyTaskResult {
	/** For paging—if present, use as lastId next call. */
	lastId?: string;
	/** Page of tasks. */
	tasks: GetTaskResult[];
}
/** Update result adds ETA fields */
export interface UpdateTaskResult extends OnfleetTask {
	/** New ETA (ms). */
	eta: number;
	/** Estimated arrival (ms). */
	estimatedArrivalTime: number | null;
	/** Estimated completion (ms). */
	estimatedCompletionTime: number | null;
}

/** Props for auto-assigning tasks */
export interface AutomaticallyAssignTaskProps {
	tasks: string[];
	/** Assignment options. */
	options?: TaskAutoAssignOptions;
}
/** Result of auto-assign */
export interface AutomaticallyAssignTaskResult {
	assignedTasksCount: number;
	/** Mapping of taskID→workerID. */
	assignedTasks: Record<string, string>;
}

/** Options for auto-assign endpoints */
export interface TaskAutoAssignOptions {
	/** "distance" or "load". */
	mode: string;
	/** Restrict to this single team. */
	team?: string;
	/** Exclude these workers. */
	excludedWorkerIds?: string[];
	/** Max tasks per worker. */
	maxAssignedTaskCount?: string[];
	/** Include dependencies in calculation. */
	considerDependencies?: boolean;
	/** For multi-assign: list of team IDs. */
	teams?: string[];
	/** Restrict to those teams only. */
	restrictAutoAssignmentToTeam?: boolean;
}

/**
 * Tasks resource: create, batch, get, list, update, complete, clone,
 * delete, auto-assign, and metadata operations.
 */
export default class Tasks extends Resource {
	/** Create one task */
	public create!: (props: CreateTaskProps) => Promise<OnfleetTask>;
	/** @deprecated use batchCreateAsync */
	public batchCreate!: (props: CreateMultipleTasksProps) => Promise<CreateMultipleTasksResult>;
	/** Create many tasks asynchronously */
	public batchCreateAsync!: (
		props: CreateMultipleTasksProps,
	) => Promise<CreateAsyncMultipleTaskResult>;
	/** Check status of async batch job */
	public getBatch!: (jobId: string) => Promise<{ status: string; jobId: string }>;

	/** List tasks (/tasks/all?…) */
	public list!: (params: ListTasksParams) => Promise<GetManyTaskResult>;

	/** Get a single task by ID (/tasks/:taskId) */
	public get!: (id: string) => Promise<OnfleetTask>;

	/** Retrieve by short-ID */
	public getByShortId!: (shortId: string) => Promise<OnfleetTask>;
	/** Update notes, metadata, container or destination on active tasks */
	public update!: (id: string, props: UpdateTaskProps) => Promise<UpdateTaskResult>;
	/** Force-complete an active task */
	public forceComplete!: (id: string, props: ForceCompleteTaskProps) => Promise<void>;
	/** Clone an existing task */
	public clone!: (id: string) => Promise<OnfleetTask>;
	/** Delete a task */
	public deleteOne!: (id: string) => Promise<number>;
	/** Automatically assign tasks */
	public autoAssign!: (
		props: AutomaticallyAssignTaskProps,
	) => Promise<AutomaticallyAssignTaskResult>;
	/** Metadata match operations */
	public matchMetadata!: MatchMetadata<OnfleetTask["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/tasks", method: "POST" },
			batchCreate: { path: "/tasks/batch", method: "POST" },
			batchCreateAsync: { path: "/tasks/batch-async", method: "POST" },
			getBatch: { path: "/tasks/batch/:batchId", method: "GET" },
			list: { path: "/tasks/all", method: "GET", queryParams: true },
			get: { path: "/tasks/:taskId", method: "GET" },
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
