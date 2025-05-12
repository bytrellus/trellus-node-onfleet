import Resource, { Api } from "../resource";

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

/**
 * Trigger type pairing ID to its name
 */
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

/** Payload definitions under Webhook namespace */
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

	// Extend these payloads as needed per trigger
}

/**
 * Shape of a webhook to create
 */
export interface OnfleetWebhook {
	trigger: WebhookTriggerType["triggerId"];
	url: string;
	name?: string;
	threshold?: number;
}

/**
 * Basic webhook result
 */
export interface WebhookResult {
	count: number;
	id: string;
	trigger: WebhookTriggerType["triggerId"];
	url: string;
}

/**
 * Extended webhook info
 */
export interface GetWebhookResult extends WebhookResult {
	isEnabled: boolean;
}

/**
 * Webhooks resource: create, list, and delete webhooks
 */
export default class Webhooks extends Resource {
	/**
	 * Create a new webhook
	 */
	public create!: (webhook: OnfleetWebhook) => Promise<WebhookResult>;

	/**
	 * Retrieve all webhooks
	 */
	public get!: () => Promise<GetWebhookResult[]>;

	/**
	 * Delete a webhook by ID
	 */
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
