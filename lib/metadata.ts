/**
 * Metadata utilities and types for Onfleet
 */

/** Visibility scopes for custom metadata fields */
export type MetadataVisibility = "api" | "dashboard" | "worker";

/** Primitive data types allowed in metadata */
export type MetadataType = "boolean" | "number" | "string" | "object" | "array";

/** Sub-types for object metadata */
export type MetadataSubType = "boolean" | "number" | "string" | "object";

/**
 * Standard shape of a metadata entry in Onfleet
 */
export interface OnfleetMetadata {
	/** Key name of the metadata field */
	name: string;
	/** Data type of the metadata field */
	type: MetadataType;
	/** More specific subtype when type is "object" or "array" */
	subtype?: MetadataSubType;
	/** Scopes in which this metadata is visible */
	visibility?: MetadataVisibility[];
	/** Actual value stored in the metadata field */
	value: unknown;
}

/** Result returned by metadata matching operations */
export interface MatchMetadataResult {
	/** Identifier of the parent entity (e.g., admin, worker) */
	id: string;
	/** Array of metadata entries that match the criteria */
	metadata: OnfleetMetadata[];
}

/**
 * Generic function signature to match metadata on an object.
 * @param obj - Entity object containing metadata to match
 * @returns A promise resolving to an array of match results
 */
export type MatchMetadata<T> = (obj: T) => Promise<MatchMetadataResult[]>;
