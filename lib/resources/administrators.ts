import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";

export interface OnfleetAdmin {
	email: string;
	id: string;
	isActive: boolean;
	metadata: OnfleetMetadata;
	name: string;
	organization: string;
	phone: string;
	timeCreated: number;
	timeLastModified: number;
	type: "super" | "standard";
}

export interface CreateAdminProps {
	/** The administrator’s email address */
	email: string;
	/** The administrator’s complete name */
	name: string;
	/** Optional. The administrator's phone number. */
	phone?: string;
	/** Optional. Whether this administrator can perform write operations. */
	isReadOnly?: boolean;
}

export interface UpdateAdminProps {
	email?: string;
	name?: string;
	metadata?: OnfleetMetadata;
}

/**
 * Administrators resource: CRUD operations for Onfleet administrators
 */
export default class Administrators extends Resource {
	/**
	 * Create a new administrator
	 */
	public create!: (props: CreateAdminProps) => Promise<OnfleetAdmin>;
	/**
	 * Retrieve all administrators
	 */
	public get!: () => Promise<OnfleetAdmin[]>;
	/**
	 * Update an existing administrator
	 */
	public update!: (id: string, props: UpdateAdminProps) => Promise<OnfleetAdmin>;
	/**
	 * Delete a specific administrator by ID
	 */
	public deleteOne!: (id: string) => Promise<void>;
	/**
	 * Match metadata operations for administrators
	 */
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
