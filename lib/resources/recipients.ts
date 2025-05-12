import { MatchMetadata, OnfleetMetadata } from "../metadata";
import Resource, { Api } from "../resource";

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

export default class Recipients extends Resource {
	/** Create a new recipient */
	public create!: (props: CreateRecipientProps) => Promise<OnfleetRecipient>;

	/** Retrieve a recipient by ID */
	public get!: (id: string) => Promise<OnfleetRecipient>;

	/** Find a recipient by (exact) name */
	public findByName!: (name: string) => Promise<OnfleetRecipient>;

	/**
	 * Find a recipient by (E.164-formatted) phone.
	 * Pass `{ skipPhoneNumberValidation: true }` to bypass validation.
	 */
	public findByPhone!: (
		phone: string,
		query?: { skipPhoneNumberValidation?: boolean },
	) => Promise<OnfleetRecipient>;

	/** Update a recipient by ID */
	public update!: (id: string, props: Partial<CreateRecipientProps>) => Promise<OnfleetRecipient>;

	/** Metadata operations for recipients */
	public matchMetadata!: MatchMetadata<OnfleetRecipient["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/recipients", method: "POST" },
			get: { path: "/recipients/:recipientId", method: "GET" },
			findByName: { path: "/recipients/name/:name", method: "GET" },
			findByPhone: { path: "/recipients/phone/:phone", method: "GET", queryParams: true },
			update: { path: "/recipients/:recipientId", method: "PUT" },
			matchMetadata: { path: "/recipients/metadata", method: "POST" },
		});
	}
}
