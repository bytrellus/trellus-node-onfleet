import Resource, { Api } from "../resource.js";

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
 * Props for updating a container's tasks
 */
export interface UpdateContainerProps {
	tasks: string[];
}

/**
 * Container resource: retrieve and modify Onfleet containers
 */
export default class Containers extends Resource {
	/**
	 * Retrieve a container by ID and group
	 * @param id - Base64 ID of the container
	 * @param group - One of "organization", "team", or "worker"
	 */
	public get!: (
		id: string,
		group: "organization" | "team" | "worker",
	) => Promise<OnfleetContainer>;

	/**
	 * Replace the tasks in a container
	 * @param id - Base64 ID of the container
	 * @param group - One of "organization", "team", or "worker"
	 * @param props - New array of task IDs
	 */
	public update!: (
		id: string,
		group: "organization" | "team" | "worker",
		props: UpdateContainerProps,
	) => Promise<OnfleetContainer>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			get: {
				path: "/containers/:group/:containerId",
				method: "GET",
			},
			update: {
				path: "/containers/:group/:containerId",
				method: "PUT",
			},
		});
	}
}
