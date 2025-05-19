import Resource, { Api } from "../resource.js";

/** Shape of an organization returned by Onfleet */
export interface OnfleetOrganization {
	id: string;
	timeCreated: number;
	timeLastModified: number;
	name: string;
	email: string;
	image: string;
	timezone: string;
	country: string;
	delegatees: string[];
}

/** Shape of a delegatee in an organization */
export interface Delegatee {
	id: string;
	name: string;
	email: string;
	timezone: string;
	country: string;
}

/** Organization resource: fetch organization details and insert tasks */
export default class Organization extends Resource {
	/**
	 * Retrieve default organization details or by specific ID
	 * - get() → GET /organization
	 * - get(id) → GET /organizations/:orgId
	 */
	public get!: (id?: string) => Promise<OnfleetOrganization | Delegatee>;

	/** Insert tasks under an organization (not in original client but available upstream)
	 *  PUT /organizations/:orgId/insertTasks
	 */
	public insertTask!: (id: string, props: { tasks: string[] }) => Promise<OnfleetOrganization>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			get: {
				path: "/organizations/:orgId",
				altPath: "/organization",
				method: "GET",
			},
			insertTask: {
				path: "/organizations/:orgId/insertTasks",
				method: "PUT",
			},
		});
	}
}
