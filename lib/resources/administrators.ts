import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";

/** Shape of an administrator in Onfleet */
export interface OnfleetAdmin {
	/** Unique identifier */
	id: string;
	/** Email address */
	email: string;
	/** Full name */
	name: string;
	/** Whether the admin is active */
	isActive: boolean;
	/** The admin’s metadata object */
	metadata: OnfleetMetadata;
	/** Organization ID */
	organization: string;
	/** Phone number */
	phone: string;
	/** When created (ms since epoch) */
	timeCreated: number;
	/** When last modified (ms since epoch) */
	timeLastModified: number;
	/** Admin type */
	type: "super" | "standard";
}

/** Props for creating a new administrator */
export interface CreateAdminProps {
	/** The administrator’s email address */
	email: string;
	/** The administrator’s complete name */
	name: string;
	/** Optional phone number */
	phone?: string;
	/** Optional flag: true => read-only (cannot write) */
	isReadOnly?: boolean;
}

/** Props for updating an existing administrator */
export interface UpdateAdminProps {
	/** New email address */
	email?: string;
	/** New full name */
	name?: string;
	/** New metadata object */
	metadata?: OnfleetMetadata;
}

/** Administrators resource: CRUD & metadata operations */
export default class Administrators extends Resource {
	/** Create a new administrator */
	public create!: (props: CreateAdminProps) => Promise<OnfleetAdmin>;

	/** Retrieve all administrators */
	public get!: () => Promise<OnfleetAdmin[]>;

	/** Update an existing administrator */
	public update!: (id: string, props: UpdateAdminProps) => Promise<OnfleetAdmin>;

	/** Delete a specific administrator by ID */
	public deleteOne!: (id: string) => Promise<void>;

	/** Metadata operations for administrators */
	public matchMetadata!: MatchMetadata<OnfleetAdmin["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/admins", method: "POST" },
			get: { path: "/admins", method: "GET" },
			update: { path: "/admins/:adminId", method: "PUT" },
			deleteOne: { path: "/admins/:adminId", method: "DELETE" },
			matchMetadata: { path: "/admins/metadata", method: "POST" },
		});
	}
}
