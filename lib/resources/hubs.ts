import Resource, { Api } from "@/resource.js";
import {
	OnfleetDestination as BaseDestination,
	DestinationAddress,
	Location,
} from "@/resources/destinations.js";

/**
 * Shape of a hub object returned by Onfleet
 */
export interface OnfleetHub {
	/** Street address of the hub */
	address: BaseDestination["address"];
	/** Unique identifier of the hub */
	id: string;
	/** Longitude/latitude of the hub location */
	location: Location;
	/** Descriptive name of the hub */
	name: string;
	/** Array of team IDs associated with the hub */
	teams: string[];
}

/**
 * Properties for creating a new hub
 */
export interface CreateHubProps {
	/** The hub’s street address information. */
	address: DestinationAddress;
	/** A name to identify the Hub. */
	name: string;
	/** Team ID(s) that this Hub will be assigned to. */
	team?: string[];
}

/**
 * Hubs resource: CRUD operations for Onfleet hubs
 */
export default class Hubs extends Resource {
	/**
	 * Create a new hub
	 */
	public create!: (props: CreateHubProps) => Promise<OnfleetHub>;
	/**
	 * Retrieve all hubs
	 */
	public get!: () => Promise<OnfleetHub[]>;
	/**
	 * Update a hub by ID
	 */
	public update!: (id: string, props: Partial<OnfleetHub>) => Promise<OnfleetHub>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/hubs", method: "POST" },
			get: { path: "/hubs", method: "GET" },
			update: { path: "/hubs/:hubId", method: "PUT" },
		});
	}
}
