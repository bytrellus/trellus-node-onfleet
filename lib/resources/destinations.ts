import { MatchMetadata, OnfleetMetadata } from "../metadata.js";
import Resource, { Api } from "../resource.js";

/** A longitude/latitude tuple */
export type Location = [number, number];

/** Language options for create */
export interface DestinationOptions {
	/** ISO-639 2-letter country/language code */
	language?: string;
}

/** Address properties for creating or updating a destination */
// (you could swap this for a union ParsedAddress | UnparsedAddress if you want to mirror the docs strictly)
export interface DestinationAddress {
	/** A complete, unparsed address string — takes precedence if present */
	unparsed?: string;
	/** e.g. “Transamerica Pyramid” */
	name?: string;
	/** suite or apartment number */
	apartment?: string;

	/** These are required when you’re not using unparsed */
	number: string;
	street: string;
	city: string;
	country: string;
	state?: string;
	postalCode?: string;
}

/** Warnings the API may emit on create */
export type DestinationAddressWarning =
	/** The resulting address number is different than the input address number */
	| "MISMATCH_NUMBER"
	/** The resulting postal code is different than the input address postal code */
	| "MISMATCH_POSTALCODE"
	/** The address needs apartment number precision or additional inputs */
	| "GEOMETRIC_CENTER"
	/** The returned response from Google does not match all elements from the supplied address */
	| "PARTIAL_MATCH";

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
	googlePlaceId: string | null;
	warnings: DestinationAddressWarning[];
}

/** Properties for creating a new destination */
export interface CreateDestinationProps {
	address: DestinationAddress;
	location?: Location;
	notes?: string;

	/** new: language options */
	options?: DestinationOptions;
}

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
