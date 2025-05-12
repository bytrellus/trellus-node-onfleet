import { MatchMetadata, OnfleetMetadata } from "../metadata";
import Resource, { Api } from "../resource";
import { CreateDestinationProps, OnfleetDestination } from "./destinations";
import { CreateRecipientProps, OnfleetRecipient } from "./recipients";

/** Keys for querying tasks */
export type TaskQueryKey = "shortId";

/** Possible task states */
export enum TaskState {
	Unassigned,
	Assigned,
	Active,
	Completed,
}

/** Simplified completion event */
export interface CompletionEvent {
	name: string;
	time: number;
	location?: [number, number];
}

/** Details for task completion */
export interface TaskCompletionDetails {
	failureNotes?: string;
	failureReason?: string;
	events: CompletionEvent[];
	time: number | null;
	firstLocation?: [number, number];
	lastLocation?: [number, number];
	notes?: string;
	success?: boolean;
	signatureUploadId?: string | null;
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
	location: [number, number];
	time: number;
	wasRequested: boolean;
}

/** Containers for tasks */
export type TaskContainer =
	| { type: "WORKER"; worker: string }
	| { type: "ORGANIZATION"; organization: string }
	| { type: "TEAM"; team: string };

/** Full OnfleetTask shape */
export interface OnfleetTask extends OnfleetDestination {
	id: string;
	state: TaskState;
	creator: string;
	organization: string;
	executor: string;
	container: TaskContainer;
	// ...other fields as needed
	metadata: OnfleetMetadata[];
	recipients: OnfleetRecipient[];
	completionDetails: TaskCompletionDetails;
	barcodes?: { required: Barcode[]; captured: CapturedBarcode[] };
}

/** Props for creating a single task */
export interface CreateTaskProps {
	destination: string | CreateDestinationProps;
	recipients: string[] | CreateRecipientProps[];
	autoAssign?: Omit<Partial<Record<string, unknown>>, "teams">;
	dependencies?: string[];
	metadata?: OnfleetMetadata[];
	notes?: string;
	pickupTask?: boolean;
}

/** Props for batch task creation */
export interface CreateMultipleTasksProps {
	tasks: CreateTaskProps[];
}

export interface CreateMultipleTasksResult {
	tasks: OnfleetTask[];
}

export interface CreateAsyncMultipleTaskResult {
	status: string;
	jobId: string;
}

export interface GetTaskResult extends OnfleetTask {
	eta: number | null;
	estimatedCompletionTime: number | null;
}

export interface GetManyTaskResult {
	lastId?: string;
	tasks: GetTaskResult[];
}

export interface UpdateTaskResult extends OnfleetTask {
	eta: number;
	estimatedArrivalTime: number | null;
	estimatedCompletionTime: number | null;
}

export interface AutomaticallyAssignTaskProps {
	tasks: string[];
	options?: Partial<Record<string, unknown>>;
}

export interface AutomaticallyAssignTaskResult {
	assignedTasksCount: number;
	assignedTasks: Record<string, string>;
}

/**
 * Tasks resource: comprehensive CRUD, batch, clone, and metadata operations
 */
export default class Tasks extends Resource {
	public create!: (props: CreateTaskProps) => Promise<OnfleetTask>;
	public get!: (
		queryOrId?: string,
		queryKeyOrParams?: TaskQueryKey | Partial<Record<string, any>>,
	) => Promise<OnfleetTask | GetManyTaskResult>;
	public update!: (id: string, props: Partial<CreateTaskProps>) => Promise<UpdateTaskResult>;
	public deleteOne!: (id: string) => Promise<number>;
	public clone!: (id: string) => Promise<OnfleetTask>;
	public forceComplete!: (
		id: string,
		details: { completionDetails: { success: boolean; notes?: string } },
	) => Promise<void>;
	public batchCreate!: (props: CreateMultipleTasksProps) => Promise<CreateMultipleTasksResult>;
	public batchCreateAsync!: (
		props: CreateMultipleTasksProps,
	) => Promise<CreateAsyncMultipleTaskResult>;
	public getBatch!: (jobId: string) => Promise<{ status: string; jobId: string }>; // simplified
	public autoAssign!: (
		props: AutomaticallyAssignTaskProps,
	) => Promise<AutomaticallyAssignTaskResult>;
	public matchMetadata!: MatchMetadata<OnfleetTask["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/tasks", method: "POST" },
			get: {
				path: "/tasks/:taskId",
				altPath: "/tasks/all",
				method: "GET",
				queryParams: true,
			},
			update: { path: "/tasks/:taskId", method: "PUT" },
			deleteOne: { path: "/tasks/:taskId", method: "DELETE" },
			clone: { path: "/tasks/:taskId/clone", method: "POST" },
			forceComplete: { path: "/tasks/:taskId/complete", method: "POST" },
			batchCreate: { path: "/tasks/batch", method: "POST" },
			batchCreateAsync: { path: "/tasks/batch-async", method: "POST" },
			getBatch: { path: "/tasks/batch/:batchId", method: "GET", queryParams: true },
			autoAssign: { path: "/tasks/autoAssign", method: "POST" },
			matchMetadata: { path: "/tasks/metadata", method: "POST" },
		});
	}
}
