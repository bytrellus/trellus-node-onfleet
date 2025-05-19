import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";

/** A longitude/latitude tuple */
export type Location = [number, number];

/** Address properties for creating or updating a destination */
export interface DestinationAddress {
	apartment?: string;
	city: string;
	country: string;
	name?: string;
	number: string;
	postalCode?: string;
	state?: string;
	street: string;
	unparsed?: string;
}

/** Shape of a destination object returned by Onfleet */
export interface OnfleetDestination {
	id: string;
	timeCreated: number;
	timeLastModified: number;
	location: Location;
	address: {
		apartment?: string;
		state?: string;
		postalCode?: string;
		country: string;
		city: string;
		street: string;
		number: string;
	};
	notes: string;
	metadata: OnfleetMetadata[];
}

/** Properties for creating a new destination */
export interface CreateDestinationProps {
	address: DestinationAddress;
	location?: Location;
	notes?: string;
}

/** Destinations resource: create, get, and metadata operations */
export default class Destinations extends Resource {
	/** Create a new destination */
	public create!: (props: CreateDestinationProps) => Promise<OnfleetDestination>;

	/** Retrieve a destination by ID */
	public get!: (id: string) => Promise<OnfleetDestination>;

	/** Metadata operations for destinations */
	public matchMetadata!: MatchMetadata<OnfleetDestination["metadata"]>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			create: { path: "/destinations", method: "POST" },
			get: { path: "/destinations/:destinationId", method: "GET" },
			matchMetadata: { path: "/destinations/metadata", method: "POST" },
		});
	}
}
