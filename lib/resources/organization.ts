import Resource, { Api } from "@/resource.js";

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
 * Organization resource: fetch organization details
 */
export default class Organization extends Resource {
	/**
	 * Retrieve default organization details or by specific ID
	 * @param id - Optional organization ID
	 */
	public get!: (id?: string) => Promise<OnfleetOrganization | Delegatee>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			get: {
				path: "/organizations/:orgId",
				altPath: "/organization",
				method: "GET",
			},
		});
	}
}
