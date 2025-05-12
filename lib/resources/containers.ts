import Resource, { Api } from "../resource";

/**
 * Shape of a container object returned by Onfleet
 */
export interface OnfleetContainer {
	/** Unique identifier of the container */
	id: string;
	/** Timestamp when the container was created */
	timeCreated: number;
	/** Timestamp when the container was last modified */
	timeLastModified: number;
	/** Organization ID owning the container */
	organization: string;
	/** Type of container (organization, team, or worker) */
	type: "ORGANIZATION" | "TEAM" | "WORKER";
	/** ID of the currently active task, if any */
	activeTask: string | null;
	/** List of task IDs currently in the container */
	tasks: string[];
	/** Worker ID associated with the container (for worker-type containers) */
	worker: string;
}

/**
 * Container resource: operations for Onfleet containers
 */
export default class Containers extends Resource {
	/**
	 * Retrieve a container by ID and group
	 * @param id - Base64 ID of the container
	 * @param group - One of "organizations", "teams", or "workers"
	 */
	public get!: (
		id: string,
		group: "organizations" | "teams" | "workers",
	) => Promise<OnfleetContainer>;

	constructor(api: Api) {
		super(api);
		// Use default API timeout
		this.defineTimeout(null);

		this.endpoints({
			get: {
				path: "/containers/:param/:containerId",
				method: "GET",
			},
		});
	}
}
