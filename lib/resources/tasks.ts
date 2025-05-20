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
	/** Notes when it failed (empty string if none) */
	failureNotes: string;
	/** Notes when it succeeded (empty string if none) */
	successNotes: string;
	/** “NONE” or other reason code */
	failureReason: string;
	/** Collected events */
	events: CompletionEvent[];
	/** Any actions taken at completion */
	actions: any[];
	/** Timestamp (ms) or null if not done */
	time: number | null;
	/** Upload ID or null */
	signatureUploadId: string | null;
	/** Single-photo upload ID or null */
	photoUploadId: string | null;
	/** Multi-photo upload IDs or null */
	photoUploadIds: string[] | null;
	/** First location coords or empty array */
	firstLocation: number[];
	/** Last location coords or empty array */
	lastLocation: number[];
	/** Any attachments that couldn't be retrieved */
	unavailableAttachments: any[];
}

/** Definition for a barcode requirement */
export interface Barcode {
	/** Block non-required scans. */
	blockCompletion?: boolean;
	/** Data string to match. */
	data?: string;
}

/** A barcode actually captured at completion */
export interface CapturedBarcode {
	id: string;
	symbology: string;
	data: string;
	location: Location;
	time: number;
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
	/** Who created it. */
	creator: string;
	/** Owning organization. */
	organization: string;
	/** Responsible/executor org. */
	executor: string;
	/** Which container holds this task. */
	container: TaskContainer;

	/** Destination ID or embedded object. */
	destination: string | OnfleetDestination;
	/** Recipient IDs or embedded objects. */
	recipients: Array<OnfleetRecipient | string>;
	/** Free-form metadata. */
	metadata: OnfleetMetadata[];
	/** Optional notes. */
	notes?: string;

	/** Earliest allowed finish time (ms since epoch). */
	completeAfter?: number;
	/** Latest allowed finish time (ms since epoch). */
	completeBefore?: number;
	/** True for pickup tasks. */
	pickupTask: boolean;
	/** Units to drop/pickup (for routing). */
	quantity: number;
	/** Minutes on-site (for routing). */
	serviceTime?: number;

	/** Visual pin options. */
	appearance?: Appearance;
	/** IDs of tasks that must finish first. */
	dependencies?: string[];
	/** True if autoAssign succeeded. */
	didAutoAssign?: boolean;
	/** Any recipient feedback. */
	feedback?: any[];
	/** If part of a route plan, its ID here. */
	routePlan?: string;

	/** Overridden merchant, if any. */
	merchant?: string;
	/** Human-friendly short ID. */
	shortId?: string;
	/** Live-tracking URL. */
	trackingURL?: string;
	/** Has the tracking page been viewed? */
	trackingViewed?: boolean;
	/** ID of assigned worker. */
	worker?: string | null;

	/** When it was created (ms since epoch). */
	timeCreated: number;
	/** When it was last modified. */
	timeLastModified?: number;

	/** Task-level completion requirements. */
	requirements?: TaskCompletionRequirements;
	/** Actual completion details (events, success, etc). */
	completionDetails: TaskCompletionDetails;

	/** Barcode requirements & what was captured. */
	barcodes?: {
		required: Barcode[];
		captured: CapturedBarcode[];
	};

	/** Attached custom fields & values. */
	customFields?: TaskCustomField[];
}

/** Parameters for creating a single task */
export interface CreateTaskProps {
	/** Destination ID or full object to auto-create. */
	destination: string | CreateDestinationProps;
	/** Recipient IDs or full objects to auto-create. */
	recipients: string[] | CreateRecipientProps[];
	/** Merchant org to show in notifications. */
	merchant?: string;
	/** Executor org for fulfillment. */
	executor?: string;
	/** Earliest completion timestamp (ms). */
	completeAfter?: number;
	/** Latest completion timestamp (ms). */
	completeBefore?: number;
	/** True = pickup; false = drop-off. */
	pickupTask?: boolean;
	/** Notes (max 10k chars). */
	notes?: string;
	/** Automatic assignment options. */
	autoAssign?: Omit<TaskAutoAssignOptions, "teams" | "restrictAutoAssignmentToTeam">;
	/** If you want a non-default container. */
	container?: TaskContainer;
	/** Other task IDs that must complete first. */
	dependencies?: string[];
	/** Units for routing. */
	quantity?: number;
	/** On-site time in minutes for routing. */
	serviceTime?: number;
	/** Override recipient name just for this task. */
	recipientName?: string;
	/** Override recipient notes just for this task. */
	recipientNotes?: string;
	/** Override SMS settings for this task only. */
	recipientSkipSMSNotifications?: boolean;
	/** Use merchant org for proxy notifications. */
	useMerchantForProxy?: boolean;
	/** Require signature/photo/notes/age. */
	requirements?: TaskCompletionRequirements;
	/** Block scanning non-required barcodes. */
	scanOnlyRequiredBarcodes?: boolean;
	/** Which barcodes to require. */
	barcodes?: Barcode[];
	/** Pin appearance settings. */
	appearance?: Appearance;
	/** Attach custom fields & values. */
	customFields?: TaskCustomField[];
	/** Arbitrary metadata. */
	metadata?: OnfleetMetadata[];
}

/**
 * Properties you can pass to the Update Task endpoint.
 * Note: for active tasks you may update notes, metadata or container;
 * for completed tasks only metadata; and to change the destination
 * you must first update it via the Destinations API and then supply its ID here.
 */
export interface UpdateTaskProps {
	/** Free-form notes (max 10 000 chars) */
	notes?: string;
	/** Arbitrary task metadata (will overwrite existing) */
	metadata?: OnfleetMetadata[];
	/** Move this task into a different container (org, team or worker) */
	container?: TaskContainer;
	/** ID of an already-updated Destination to attach to this task */
	destination?: string;
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

/** Batch‐create (sync) parameters */
export interface CreateMultipleTasksProps {
	tasks: CreateTaskProps[];
}
/** Sync batch‐create result */
export interface CreateMultipleTasksResult {
	tasks: OnfleetTask[];
}
/** Async batch‐create result */
export interface CreateAsyncMultipleTaskResult {
	status: string;
	jobId: string;
}

/** GET‐single adds ETA fields */
export interface GetTaskResult extends OnfleetTask {
	/** Estimated arrival (ms). */
	eta: number | null;
	/** Estimated completion (ms). */
	estimatedCompletionTime: number | null;
}
/** GET‐many (list) response */
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
	maxAssignedTaskCount?: number;
	/** Include deps in calc. */
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
	/** Update notes/metadata or container on active tasks */
	public update!: (id: string, props: UpdateTaskProps) => Promise<UpdateTaskResult>;
	/** Force-complete a task */
	public forceComplete!: (
		id: string,
		details: { completionDetails: { success: boolean; notes?: string } },
	) => Promise<void>;
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
