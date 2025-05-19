import Resource, { Api } from "../resource.js";

/** Possible webhook triggers */
export enum WebhookTriggerName {
	SmsRecipientResponseMissed = "smsRecipientResponseMissed",
	TaskArrival = "taskArrival",
	TaskAssigned = "taskAssigned",
	TaskCloned = "taskCloned",
	TaskCompleted = "taskCompleted",
	TaskCreated = "taskCreated",
	TaskDelayed = "taskDelayed",
	TaskDeleted = "taskDeleted",
	TaskEta = "taskEta",
	TaskFailed = "taskFailed",
	TaskStarted = "taskStarted",
	TaskUnassigned = "taskUnassigned",
	TaskUpdated = "taskUpdated",
	WorkerDuty = "workerDuty",
}

/** Trigger type pairing ID to its name */
export type WebhookTriggerType =
	| { triggerId: 0; triggerName: WebhookTriggerName.TaskStarted }
	| { triggerId: 1; triggerName: WebhookTriggerName.TaskEta }
	| { triggerId: 2; triggerName: WebhookTriggerName.TaskArrival }
	| { triggerId: 3; triggerName: WebhookTriggerName.TaskCompleted }
	| { triggerId: 4; triggerName: WebhookTriggerName.TaskFailed }
	| { triggerId: 5; triggerName: WebhookTriggerName.WorkerDuty }
	| { triggerId: 6; triggerName: WebhookTriggerName.TaskCreated }
	| { triggerId: 7; triggerName: WebhookTriggerName.TaskUpdated }
	| { triggerId: 8; triggerName: WebhookTriggerName.TaskDeleted }
	| { triggerId: 9; triggerName: WebhookTriggerName.TaskAssigned }
	| { triggerId: 10; triggerName: WebhookTriggerName.TaskUnassigned }
	| { triggerId: 12; triggerName: WebhookTriggerName.TaskDelayed }
	| { triggerId: 13; triggerName: WebhookTriggerName.TaskCloned }
	| { triggerId: 14; triggerName: WebhookTriggerName.SmsRecipientResponseMissed };

/**
 * Payload definitions for each webhook trigger
 */
export namespace WebhookPayloads {
	export interface ActionContext {
		id: string;
		type: string;
		apiKeyScopeId?: string;
	}

	export interface WebhookPayload {
		actionContext: ActionContext | null;
		adminId: string | null;
		taskId: string | null;
		time: number;
		triggerId: number;
		triggerName: string;
		workerId: string | null;
	}

	export interface TaskCreatedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskUpdatedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
			worker?: Record<string, unknown>;
		};
	}

	export interface TaskClonedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskAssignedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
			worker: Record<string, unknown>;
		};
	}

	export interface TaskUnassignedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskDeletedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskStartedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskFailedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskCompletedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
	}

	export interface TaskDelayedPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
		delay: number;
	}

	export interface TaskETAPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
		etaSeconds: number;
	}

	export interface TaskArrivalPayload extends WebhookPayload {
		data: {
			task: Record<string, unknown>;
		};
		distance: number;
	}

	export interface WorkerCreatedPayload extends WebhookPayload {
		data: {
			worker: Record<string, unknown>;
		};
	}

	export interface WorkerDeletedPayload extends WebhookPayload {
		data: {
			worker: Record<string, unknown>;
		};
	}

	export interface WorkerDutyPayload extends WebhookPayload {
		data: {
			worker: Record<string, unknown>;
		};
		status: number;
	}

	export interface SMSRecipientOptOutPayload extends WebhookPayload {
		recipient: {
			id: string;
			name: string;
			phone: string;
		};
		timestamp: number;
		SMS: string;
		data: Record<string, unknown>;
	}

	export interface AutoDispatchJobCompletedPayload extends WebhookPayload {
		data: {
			dispatch: Record<string, unknown>;
		};
		dispatchId: string;
	}

	export interface TaskBatchCreateJobCompletedPayload extends WebhookPayload {
		jobId: string;
		status: string;
		tasksReceived: number;
		tasksCreated: number;
		tasksErrored: number;
		errors: Array<{
			statusCode: number;
			errorCode: number;
			message: string;
			cause: string;
			taskData: Record<string, unknown>;
		}>;
		failedTasks: Array<Record<string, unknown>>;
		newTasks: Array<Record<string, unknown>>;
		newTasksWithWarnings: Array<Record<string, unknown>>;
		data: Record<string, unknown>;
	}
}

/** Shape of a webhook to create */
export interface OnfleetWebhook {
	trigger: WebhookTriggerType["triggerId"];
	url: string;
	name?: string;
	threshold?: number;
}

/** Basic webhook result */
export interface WebhookResult {
	count: number;
	id: string;
	trigger: WebhookTriggerType["triggerId"];
	url: string;
}

/** Extended webhook info */
export interface GetWebhookResult extends WebhookResult {
	isEnabled: boolean;
}

/** Webhooks resource: create, list, and delete webhooks */
export default class Webhooks extends Resource {
	public create!: (webhook: OnfleetWebhook) => Promise<WebhookResult>;
	public get!: () => Promise<GetWebhookResult[]>;
	public deleteOne!: (id: string) => Promise<void>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);

		this.endpoints({
			create: { path: "/webhooks", method: "POST" },
			get: { path: "/webhooks", method: "GET" },
			deleteOne: { path: "/webhooks/:webhookId", method: "DELETE" },
		});
	}
}
