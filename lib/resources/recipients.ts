import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";

/** Keys for querying recipients */
export type RecipientQueryKey = "phone" | "name";

/** Shape of a recipient object returned by Onfleet */
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

/** Properties for creating a new recipient */
export interface CreateRecipientProps {
	name: string;
	phone: string;
	metadata?: OnfleetMetadata[];
	notes?: string;
	skipSMSNotifications?: boolean;
	skipPhoneNumberValidation?: boolean;
}

/** Recipients resource: CRUD and metadata operations */
export default class Recipients extends Resource {
	/** Create a new recipient */
	public create!: (props: CreateRecipientProps) => Promise<OnfleetRecipient>;

	/**
	 * Retrieve a recipient by ID or lookup by name/phone
	 * - get(id) → GET /recipients/:recipientId
	 * - get(value, "name") → GET /recipients/name/:value
	 * - get(value, "phone") → GET /recipients/phone/:value
	 */
	public get!: (value: string, key?: RecipientQueryKey) => Promise<OnfleetRecipient>;

	/** Alias for get(value, "name") */
	public findByName!: (name: string) => Promise<OnfleetRecipient>;

	/** Alias for get(value, "phone") with optional skipValidation */
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
			get: {
				path: "/recipients/:recipientId",
				altPath: "/recipients/:key/:value",
				method: "GET",
				queryParams: true,
			},
			findByName: { path: "/recipients/name/:name", method: "GET" },
			findByPhone: { path: "/recipients/phone/:phone", method: "GET", queryParams: true },
			update: { path: "/recipients/:recipientId", method: "PUT" },
			matchMetadata: { path: "/recipients/metadata", method: "POST" },
		});
	}
}
