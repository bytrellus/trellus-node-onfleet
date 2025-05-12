/**
 * Base error class with additional metadata
 */
export class CustomError extends Error {
	public status: number | null;
	public cause?: unknown;
	public request?: unknown;

	constructor(
		name: string,
		message: string,
		status: number | null = null,
		cause?: unknown,
		request?: unknown,
	) {
		super(message);

		this.name = name;
		this.status = status;
		this.cause = cause;
		this.request = request;

		// Restore prototype chain
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

/**
 * Error for validation failures
 */
export class ValidationError extends CustomError {
	constructor(message: string) {
		super("ValidationError", message);
	}
}

/**
 * Error for permission or authorization failures
 */
export class PermissionError extends CustomError {
	constructor(message: string, status: number | null = null, cause?: unknown, request?: unknown) {
		super("PermissionError", message, status, cause, request);
	}
}

/**
 * Generic HTTP error wrapper
 */
export class HttpError extends CustomError {
	constructor(message: string, status: number | null = null, cause?: unknown, request?: unknown) {
		super("HttpError", message, status, cause, request);
	}
}

/**
 * Error signaling that rate limits have been exceeded
 */
export class RateLimitError extends CustomError {
	constructor(message: string, status: number | null = null, cause?: unknown, request?: unknown) {
		super("RateLimitError", message, status, cause, request);
	}
}

/**
 * Catch-all service error
 */
export class ServiceError extends CustomError {
	constructor(message: string, status: number | null = null, cause?: unknown, request?: unknown) {
		super("ServiceError", message, status, cause, request);
	}
}
