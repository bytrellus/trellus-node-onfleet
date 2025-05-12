import { MatchMetadata, OnfleetMetadata } from "../metadata";
import Resource, { Api } from "../resource";

/**
 * Keys for querying recipients: by phone or name
 */
export type RecipientQueryKey = "phone" | "name";

/**
 * Shape of a recipient object returned by Onfleet
 */
export interface OnfleetRecipient {
	id: string;
	metadata: OnfleetMetadata[];
	name: string;
	notes: string;
	organization: string;
	phone: string;
	skipSMSNotifications: boolean;
	timeCreated: number;
	timeLastModified: number;
}

/**
 * Properties for creating a new recipient
 */
export interface CreateRecipientProps {
	name: string;
	phone: string;
	metadata?: OnfleetMetadata[];
	notes?: string;
	skipSMSNotifications?: boolean;
	skipPhoneNumberValidation?: boolean;
}

/**
 * Recipients resource: CRUD and metadata operations for Onfleet recipients
 */
export default class Recipients extends Resource {
	/**
	 * Create a new recipient
	 */
	public create!: (props: CreateRecipientProps) => Promise<OnfleetRecipient>;

	/**
	 * Retrieve a recipient by ID or query by phone/name
	 */
	public get!: (queryOrId: string, queryKey?: RecipientQueryKey) => Promise<OnfleetRecipient>;

	/**
	 * Match metadata operations for recipients
	 */
	public matchMetadata!: MatchMetadata<OnfleetRecipient["metadata"]>;

	/**
	 * Update a recipient by ID
	 */
	public update!: (id: string, props: Partial<CreateRecipientProps>) => Promise<OnfleetRecipient>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/recipients", method: "POST" },
			get: { path: "/recipients/:recipientId", method: "GET", queryParams: true },
			matchMetadata: { path: "/recipients/metadata", method: "POST" },
			update: { path: "/recipients/:recipientId", method: "PUT" },
		});
	}
}
