import Resource, { Api } from "../resource";

/**
 * A single time slot for default schedules
 */
export interface DefaultScheduleSlot {
	start: string; // "0000"
	end: string; // "2359"
}

/**
 * Default schedule entry when no worker schedule exists
 */
export interface DefaultScheduleEntry {
	date: number;
	slots: DefaultScheduleSlot[];
	owner: string;
	timezone: string;
}

/**
 * Props required to initialize (schedule) a route optimization.
 * Use `jobType: "ON-DEMAND"` for on-demand optimizations.
 */
export interface CreateRouteOptimizationProps {
	tasks: string[];
	teams: Record<string, string[]>;
	date: number;
	timezone: string;
	mode: 0 | 1 | 2 | 3;
	serviceTime: number;
	maxViolationTime: number;
	maxTasksPerRoute: number;
	schedulingMethod: 1 | 2;
	defaultSchedule: DefaultScheduleEntry[];
	optimizationServiceArea?: string;
	routeStart?: string;
	routeEnd?: string;
	osaRouteZoneCount?: number;
	autoApplyAssignment?: boolean;
	jobType?: "ON-DEMAND";
}

/** A warning or error returned from scheduling optimization */
export interface OptimizationIssue {
	type: "warning" | "error";
	message: string;
	entityType: string;
	entityId: string;
	shortId: string;
	reason: string;
}

/** Summary counts and cost info for an optimization */
export interface OptimizationSummary {
	workers: { count: number };
	tasks: { count: number; cost?: number };
	routeZones: { count: number };
	total?: number;
}

/**
 * Response when scheduling (initializing) an optimization
 */
export interface ScheduleOptimizationResult {
	id?: string;
	shortId?: string;
	issues: OptimizationIssue[];
	summary?: OptimizationSummary;
}

/**
 * Status when an optimization is in progress
 */
export interface OptimizationStatusPending {
	status: "pending";
	progress: number;
}

/**
 * Status when an optimization has completed or failed
 */
export interface OptimizationStatusComplete {
	status: "success" | "failed";
	summary: OptimizationSummary;
	metrics?: Record<string, unknown>;
}

/**
 * Union type for optimization status results
 */
export type OptimizationStatusResult = OptimizationStatusPending | OptimizationStatusComplete;

/**
 * RouteOptimizations resource: scheduled & on-demand workflow
 */
export default class RouteOptimizations extends Resource {
	/**
	 * Schedule (initialize) a new route optimization.
	 * If you include `jobType: "ON-DEMAND"`, starts an on-demand workflow.
	 */
	public schedule!: (props: CreateRouteOptimizationProps) => Promise<ScheduleOptimizationResult>;

	/**
	 * Start the optimization engine after scheduling.
	 * Returns HTTP 200 with no body on success.
	 */
	public start!: (optimizationId: string) => Promise<void>;

	/**
	 * Poll the status of an in-flight optimization.
	 */
	public getStatus!: (optimizationId: string) => Promise<OptimizationStatusResult>;

	/**
	 * Abort a running optimization.
	 * Returns `{ success: boolean }`.
	 */
	public abort!: (optimizationId: string) => Promise<{ success: boolean }>;

	/**
	 * Apply the results of a completed optimization.
	 * Returns HTTP 200 with no body on success.
	 */
	public apply!: (optimizationId: string) => Promise<void>;

	constructor(api: Api) {
		super(api);
		this.defineTimeout(null);
		this.endpoints({
			schedule: {
				path: "/optimizations/scheduled",
				method: "POST",
			},
			start: {
				path: "/optimizations/:optimizationId/start",
				method: "POST",
			},
			getStatus: {
				path: "/optimizations/:optimizationId/status",
				method: "GET",
			},
			abort: {
				path: "/optimizations/:optimizationId/abort",
				method: "POST",
			},
			apply: {
				path: "/optimizations/:optimizationId/apply",
				method: "POST",
			},
		});
	}
}
