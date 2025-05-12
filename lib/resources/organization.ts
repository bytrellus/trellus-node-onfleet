import Resource, { Api } from "../resource";

/**
 * Shape of an organization returned by Onfleet
 */
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

/**
 * Shape of a delegatee in an organization
 */
export interface Delegatee {
	id: string;
	name: string;
	email: string;
	timezone: string;
	country: string;
}

/**
 * Container task insertion parameters for organization
 */
export interface InsertTaskProps {
	tasks: string[];
}

/**
 * Organization resource: fetch and update organization data
 */
export default class Organization extends Resource {
	/**
	 * Retrieve default organization details or by specific ID
	 * @param id - Optional organization ID
	 */
	public get!: (id?: string) => Promise<OnfleetOrganization | Delegatee>;

	/**
	 * Insert tasks into an organization container
	 * @param id - Organization ID
	 * @param props - Object containing tasks array
	 */
	public insertTask!: (id: string, props: InsertTaskProps) => Promise<unknown>;

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
				path: "/containers/organizations/:orgId",
				method: "PUT",
			},
		});
	}
}
