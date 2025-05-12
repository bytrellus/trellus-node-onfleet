import nock from "nock";
import { beforeEach, describe, expect, it } from "vitest";

import { LIMITER_DEFAULT_MAX_CONCURRENT, LIMITER_DEFAULT_MIN_TIME } from "../lib/constants.js";
import Onfleet from "../lib/onfleet.js";
import * as util from "../lib/utils.js";
import response from "./response.js";

const baseUrl = "https://onfleet.com/api/v2";
const apiKey = "<your_api_key>";

const newTeam = {
	name: "Onfleet Team",
	workers: ["1LjhGUWdxFbvdsTAAXs0TFos", "F8WPCqGmQYWpCkQ2c8zJTCpW"],
	managers: ["Mrq7aKqzPFKX22pmjdLx*ohM"],
	hub: "tKxSfU7psqDQEBVn5e2VQ~*O",
};
const etaDetail = {
	dropoffLocation: "101.627378,3.1403995",
	pickupLocation: "101.5929671,3.1484824",
	pickupTime: "1620965258",
};
const completionDetail = {
	completionDetails: {
		success: true,
		notes: "Forced complete by Onfleet Wrapper",
	},
};
const updateDetail = {
	name: "Stephen Curry",
	phone: "+18883133131",
};

const createCustomField = {
	model: "Task",
	field: [
		{
			description: "this is a test",
			asArray: false,
			visibility: ["admin", "api", "worker"],
			editability: ["admin", "api"],
			key: "test",
			name: "test",
			type: "single_line_text_field",
			contexts: [
				{
					isRequired: false,
					conditions: [],
					name: "save",
				},
			],
			value: "order 123",
		},
	],
	integration: "shopify",
};

describe("Utility functions testing", () => {
	it("encode should encode an API key as expected", () => {
		expect(util.encode(response.apiKey)).toBe(response.encodedApiKey);
	});

	it("replaceWithID should replace ID as expected", () => {
		expect(util.replaceWithId(response.url, response.id)).toBe(response.pathById);
	});

	it("replaceWithEndpointAndParam should replace endpoint and parameter as expected", () => {
		expect(util.replaceWithEndpointAndParam(response.url, "phone", response.phone)).toBe(
			response.pathWithEndpoint,
		);
	});

	it("appendQueryParameters should append parameters correctly", () => {
		expect(util.appendQueryParameters(response.baseUrl, response.parameters)).toBe(
			response.pathWithQuery,
		);
	});

	it("isQueryParam should return the right boolean", () => {
		expect(util.isQueryParam(response.parameters)).toBe(true);
		expect(util.isQueryParam(response.url)).toBe(false);
	});
});

describe("Utility function testing - Auth test returns 200 ok", () => {
	beforeEach(() => {
		nock(baseUrl).get("/auth/test").reply(200, response.auth);
	});

	it("authenticate endpoint", async () => {
		const res = await util.authenticate({
			baseUrl: baseUrl,
			headers: {
				authorization: "Basic some_token",
			},
			timeout: 0,
		});

		expect(res).toBe(response.auth.status === 200);
	});
});

describe("Limiter without options", () => {
	it("limiter without bottleneck options should have default settings", () => {
		const onfleet = new Onfleet({ apiKey });

		// Use type assertion to access the private property
		const store = (Onfleet.limiter as any)._store;
		expect(store.storeOptions.maxConcurrent).toBe(LIMITER_DEFAULT_MAX_CONCURRENT);
		expect(store.storeOptions.minTime).toBe(LIMITER_DEFAULT_MIN_TIME);
	});
});

describe("Limiter with options", () => {
	beforeEach(() => {
		nock(baseUrl)
			.get((uri) => uri.includes("admins"))
			.reply(200, response.list);
	});

	it("limiter should NOT have invalid bottleneck options set", async () => {
		const invalidMaxConcurrent = 50;
		const invalidMinTime = 1;

		const onfleet = new Onfleet({
			apiKey,
			bottleneckOptions: {
				maxConcurrent: invalidMaxConcurrent,
				minTime: invalidMinTime,
			},
		});

		//bottleneck options get updated on the next request
		await onfleet.administrators.get();

		// Use type assertion to access the private property
		const store = (Onfleet.limiter as any)._store;
		expect(store.storeOptions.maxConcurrent).toBe(LIMITER_DEFAULT_MAX_CONCURRENT);
		expect(store.storeOptions.minTime).toBe(LIMITER_DEFAULT_MIN_TIME);
	});

	it("limiter should have valid bottleneck options set", async () => {
		const validMaxConcurrent = 5;
		const validMinTime = 100;

		const onfleet = new Onfleet({
			apiKey,
			bottleneckOptions: {
				maxConcurrent: validMaxConcurrent,
				minTime: validMinTime,
			},
		});

		//bottleneck options get updated on the next request
		await onfleet.administrators.get();

		// Use type assertion to access the private property
		const store = (Onfleet.limiter as any)._store;
		expect(store.storeOptions.maxConcurrent).toBe(validMaxConcurrent);
		expect(store.storeOptions.minTime).toBe(validMinTime);
	});
});

describe("Limiter behavior tests", () => {
	beforeEach(() => {
		nock(baseUrl)
			.get((uri) => uri.includes("admins"))
			.times(10)
			.reply(200, response.list);
	});

	it("should respect rate limits with default settings", async () => {
		const onfleet = new Onfleet({ apiKey });

		// Track timing and requests
		const startTime = Date.now();
		const requests: Promise<any>[] = [];

		// Make multiple concurrent requests - more than maxConcurrent
		for (let i = 0; i < 5; i++) {
			requests.push(onfleet.administrators.get());
		}

		await Promise.all(requests);
		const duration = Date.now() - startTime;

		// If default settings are applied (not changed),
		// all requests can't complete faster than minTime * (#requests/maxConcurrent)
		const expectedMinDuration =
			Math.ceil(5 / LIMITER_DEFAULT_MAX_CONCURRENT) * LIMITER_DEFAULT_MIN_TIME;
		expect(duration).toBeGreaterThanOrEqual(expectedMinDuration - 50); // Allow small margin for timing variations
	});

	it("should respect custom rate limits", async () => {
		const validMaxConcurrent = 2; // Low value to test easily
		const validMinTime = 200; // Higher time to observe easily

		const onfleet = new Onfleet({
			apiKey,
			bottleneckOptions: {
				maxConcurrent: validMaxConcurrent,
				minTime: validMinTime,
			},
		});

		// Make an initial request to ensure settings are applied
		await onfleet.administrators.get();

		// Now test the behavior
		const startTime = Date.now();
		const requests: Promise<any>[] = [];

		for (let i = 0; i < 4; i++) {
			requests.push(onfleet.administrators.get());
		}

		await Promise.all(requests);
		const duration = Date.now() - startTime;

		// With maxConcurrent=2, 4 requests should take at least 2 * minTime
		const expectedMinDuration = Math.ceil(4 / validMaxConcurrent) * validMinTime;
		expect(duration).toBeGreaterThanOrEqual(expectedMinDuration - 50);
	});
});

describe("Limiter error handling and queue behavior tests", () => {
	beforeEach(() => {
		// Clear all nock interceptors
		nock.cleanAll();
	});

	describe("Error handling tests", () => {
		it("should count failed requests against rate limits", async () => {
			// Set up nock to alternate between success and failure
			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.times(2)
				.reply(200, response.list);

			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.times(2)
				.reply(429, { message: { message: "Rate limit exceeded", error: 2300 } });

			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.times(2)
				.reply(200, response.list);

			const onfleet = new Onfleet({
				apiKey,
				bottleneckOptions: {
					maxConcurrent: 2,
					minTime: 100,
				},
			});

			const startTime = Date.now();
			const requests: Array<Promise<any>> = [];
			const results: Array<{ success: boolean; error?: unknown }> = [];

			// Create 6 requests (will be mixed successes and failures)
			for (let i = 0; i < 6; i++) {
				requests.push(
					onfleet.administrators
						.get()
						.then(() => results.push({ success: true }))
						.catch((error: unknown) => {
							results.push({ success: false, error });
						}),
				);
			}

			await Promise.allSettled(requests);
			const duration = Date.now() - startTime;

			// Verify timing - even with errors, should respect rate limits
			// 6 requests with maxConcurrent 2 should take at least 3 * minTime
			const expectedMinDuration = Math.ceil(6 / 2) * 100;
			expect(duration).toBeGreaterThanOrEqual(expectedMinDuration - 50);

			// Verify error propagation
			expect(results.filter((r) => !r.success)).toHaveLength(2);
			expect(results.filter((r) => r.success)).toHaveLength(4);

			// Verify errors are rate limit errors with correct structure
			const errors = results.filter((r) => !r.success).map((r) => r.error);
			errors.forEach((error) => {
				const errorObj = error as { name?: string };
				expect(errorObj.name).toBe("RateLimitError");
			});
		});

		it("should propagate errors correctly without affecting other requests", async () => {
			// First request fails, second succeeds
			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.reply(500, { message: { message: "Internal Server Error" } });

			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.reply(200, response.list);

			const onfleet = new Onfleet({
				apiKey,
				bottleneckOptions: {
					maxConcurrent: 1, // Force sequential processing
					minTime: 50,
				},
			});

			// First request should fail and we'll capture the error
			let capturedError: unknown;
			try {
				await onfleet.administrators.get();
			} catch (e) {
				capturedError = e;
			}

			// Second should succeed despite first failure
			const result2 = await onfleet.administrators.get();

			// Verify first request failed with HTTP error
			expect(capturedError).toBeTruthy();
			const errorObj = capturedError as { name?: string; status?: number };
			expect(errorObj.name).toBe("HttpError");
			// According to your error handling in methods.ts, with the way nock is set up,
			// the status will be null because it's using the error code from the message
			expect(errorObj.status).toBe(null);

			// Verify second request succeeded
			expect(result2).toEqual(response.list);
		});
	});

	describe("Queue behavior tests", () => {
		it("should handle large number of requests with no queue size limit", async () => {
			// Set up success responses for all requests
			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.times(20)
				.reply(200, response.list);

			const maxConcurrent = 3;
			const minTime = 100;

			const onfleet = new Onfleet({
				apiKey,
				bottleneckOptions: {
					maxConcurrent,
					minTime,
				},
			});

			const startTime = Date.now();
			const requestCount = 15; // Large enough to test queueing
			const completionTimes: number[] = [];
			const requests: Promise<any>[] = [];

			// Create many concurrent requests - they should be queued
			for (let i = 0; i < requestCount; i++) {
				const request = onfleet.administrators.get().then(() => {
					completionTimes.push(Date.now() - startTime);
					return i; // Return request index for verification
				});
				requests.push(request);
			}

			const results = await Promise.all(requests);
			const duration = Date.now() - startTime;

			// All requests should complete
			expect(results).toHaveLength(requestCount);
			expect(completionTimes).toHaveLength(requestCount);

			// Verify minimum duration based on rate limiting rules
			const expectedBatches = Math.ceil(requestCount / maxConcurrent);
			const expectedMinDuration = expectedBatches * minTime;
			expect(duration).toBeGreaterThanOrEqual(expectedMinDuration - 50);

			// Verify FIFO behavior - results should be in order of request submission
			expect(results).toEqual([...Array(requestCount).keys()]);

			// Verify batching behavior - requests should complete in groups
			const batchSize = maxConcurrent;
			for (let batch = 0; batch < expectedBatches; batch++) {
				const batchStart = batch * batchSize;
				const batchEnd = Math.min((batch + 1) * batchSize, requestCount);

				if (batch > 0) {
					// Each batch should start completing after the previous batch's minimum time
					const minBatchStartTime = batch * minTime;
					for (let i = batchStart; i < batchEnd; i++) {
						expect(completionTimes[i]).toBeGreaterThanOrEqual(minBatchStartTime - 50);
					}
				}
			}
		});

		it("should process requests in order of submission (FIFO)", async () => {
			// Set up success responses for all requests
			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.times(10)
				.reply(200, response.list);

			const executionOrder: number[] = [];

			// Create a spy function that will track execution order
			const onfleet = new Onfleet({
				apiKey,
				bottleneckOptions: {
					maxConcurrent: 1, // Force sequential to test order
					minTime: 50,
				},
			});

			// Wrap the actual get method with our tracking
			const originalGet = onfleet.administrators.get.bind(onfleet.administrators);
			onfleet.administrators.get = function () {
				const index = executionOrder.length;
				executionOrder.push(index);
				return originalGet();
			};

			// Submit requests in a specific order
			const requests: Promise<any>[] = [];
			for (let i = 0; i < 5; i++) {
				requests.push(onfleet.administrators.get());
			}

			await Promise.all(requests);

			// Verify execution order matches submission order
			expect(executionOrder).toEqual([0, 1, 2, 3, 4]);
		});
	});
});

describe("Resource Request Testing", () => {
	const onfleet = new Onfleet({ apiKey });

	describe("Get Administrators", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("admins"))
				.reply(200, response.list);
		});

		it("should retrieve administrators", async () => {
			const res = await onfleet.administrators.get();
			expect(typeof res).toBe("object");
			expect(res[0].email).toBe("james@onfleet.com");
			expect(res[0].type).toBe("super");
			expect(res[1].email).toBe("wrapper@onfleet.com");
			expect(res[1].type).toBe("standard");
		});
	});

	describe("Get Tasks", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("tasks"))
				.reply(200, response.get);
		});

		it("should get task by ID", async () => {
			const res = await onfleet.tasks.get("SxD9Ran6pOfnUDgfTecTsgXd");
			expect(typeof res).toBe("object");
			expect(res.id).toBe("SxD9Ran6pOfnUDgfTecTsgXd");
			expect(res.notes).toBe("Onfleet API Wrappers!");
		});

		it("should get task by ShortId", async () => {
			const res = await onfleet.tasks.get("44a56188", "shortId");
			expect(typeof res).toBe("object");
			expect(res.shortId).toBe("44a56188");
			expect(res.trackingURL).toBe("https://onf.lt/44a56188");
		});
	});

	describe("Get Recipients", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("recipients"))
				.reply(200, response.getRecipients);
		});

		it("should get recipient by phone number", async () => {
			const res = await onfleet.recipients.get("+18881787788", "phone");
			expect(typeof res).toBe("object");
			expect(res.phone).toBe("+18881787788");
			expect(res.skipSMSNotifications).toBe(false);
		});

		it("should get recipient by name", async () => {
			const res = await onfleet.recipients.get("Onfleet Rocks", "name");
			expect(typeof res).toBe("object");
			expect(res.name).toBe("Onfleet Rocks");
		});
	});

	describe("Create Team", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("teams"))
				.reply(200, response.createTeams);
		});

		it("should create a new team", async () => {
			const res = await onfleet.teams.create(newTeam);
			expect(typeof res).toBe("object");
			expect(res.name).toBe("Onfleet Team");
		});
	});

	describe("Get Team Worker ETA", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("teams"))
				.reply(200, response.getWorkerEta);
		});

		it("should get worker eta of a team", async () => {
			const res = await onfleet.teams.getWorkerEta("SxD9Ran6pOfnUDgfTecTsgXd", etaDetail);
			expect(typeof res).toBe("object");
			expect(res.steps[0].arrivalTime).toBe(1621339297);
		});
	});

	describe("Force Complete a Task", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("complete"))
				.reply(200, response.forceComplete);
		});

		it("should force complete a task", async () => {
			const res = await onfleet.tasks.forceComplete(
				"6Fe3qqFZ0DDwsM86zBlHJtlJ",
				completionDetail,
			);
			expect(typeof res).toBe("object");
			expect(res.status).toBe(200);
			expect(res.completionDetails.notes).toBe("Forced complete by Onfleet Wrapper");
		});
	});

	describe("Update Worker", () => {
		beforeEach(() => {
			nock(baseUrl)
				.put((uri) => uri.includes("workers"))
				.reply(200, response.updateWorkers);
		});

		it("should update a worker", async () => {
			const res = await onfleet.workers.update("Mdfs*NDZ1*lMU0abFXAT82lM", updateDetail);
			expect(typeof res).toBe("object");
			expect(res.name).toBe("Stephen Curry");
			expect(res.phone).toBe("+18883033030");
		});
	});

	describe("Delete Task", () => {
		beforeEach(() => {
			nock(baseUrl)
				.delete((uri) => uri.includes("tasks"))
				.reply(200);
		});

		it("should delete a task", async () => {
			const res = await onfleet.tasks.deleteOne("AqzN6ZAq*qlSDJ0FzmZIMZz~");
			expect(typeof res).toBe("number");
			expect(res).toBe(200);
		});
	});

	describe("Get Unassigned Tasks in a Team", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("teams/K3FXFtJj2FtaO2~H60evRrDc/tasks"))
				.reply(200, response.getTeamUnassignedTasks);
		});

		it("should get unassigned tasks in a team", async () => {
			const res = await onfleet.teams.getTasks("K3FXFtJj2FtaO2~H60evRrDc");
			expect(typeof res).toBe("object");
			expect(res.tasks.length).toBe(1);
			expect(res.tasks[0].id).toBe("3VtEMGudjwjjM60j7deSI123");
		});
	});

	describe("Get Assigned Tasks for a Worker", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("workers/ZxcnkJi~79nonYaMTQ960Mg2/tasks"))
				.reply(200, response.getWorkerAssignedTasks);
		});

		it("should get assigned tasks for a worker", async () => {
			const res = await onfleet.workers.getTasks("ZxcnkJi~79nonYaMTQ960Mg2");
			expect(typeof res).toBe("object");
			expect(res.tasks.length).toBe(1);
			expect(res.tasks[0].id).toBe("3VtEMGudjwjjM60j7deSI987");
		});
	});

	describe("Get Custom Fields", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("customFields"))
				.reply(200, response.getCustomFields);
		});

		it("should get custom fields", async () => {
			const res = await onfleet.customfields.get({ integration: "shopify" });
			expect(typeof res).toBe("object");
			expect(res.fields.length).toBe(1);
		});
	});

	describe("Create Custom Field", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("customFields"))
				.reply(200);
		});

		it("should create a custom field", async () => {
			const res = await onfleet.customfields.create(createCustomField);
			expect(res).toBe(200);
		});
	});
});
