import * as chai from "chai";
import { assert, expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import nock from "nock";
import { LIMITER_DEFAULT_MAX_CONCURRENT, LIMITER_DEFAULT_MIN_TIME } from "../lib/constants.js";
import Onfleet from "../lib/onfleet.js";
import * as util from "../lib/util.js";
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

const deliveryManifestObject = {
	hubId: "kyfYe*wyVbqfomP2HTn5dAe1~*O",
	workerId: "kBUZAb7pREtRn*8wIUCpjnPu",
	googleApiKey: "<google_direction_api_key>",
	startDate: "1455072025000",
	endDate: "1455072025000",
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

chai.use(chaiAsPromised);

describe("Utility functions testing", () => {
	it("encode should encode an API key as expected", () => {
		assert.equal(util.encode(response.apiKey), response.encodedApiKey);
	});
	it("replaceWithID should replace ID as expected", () => {
		assert.equal(util.replaceWithId(response.url, response.id), response.pathById);
	});
	it("replaceWithEndpointAndParam should replace endpoint and parameter as expected", () => {
		assert.equal(
			util.replaceWithEndpointAndParam(response.url, "phone", response.phone),
			response.pathWithEndpoint,
		);
	});
	it("appendQueryParameters should append parameters correctly", () => {
		assert.equal(
			util.appendQueryParameters(response.baseUrl, response.parameters),
			response.pathWithQuery,
		);
	});
	it("isQueryParam should return the right boolean", () => {
		assert.equal(util.isQueryParam(response.parameters), true);
		assert.equal(util.isQueryParam(response.url), false);
	});
});

describe("Utility function testing - Auth test returns 200 ok", () => {
	nock(baseUrl).get("/auth/test").reply(200, response.auth);
	it("authenticate endpoint", () => {
		return util
			.authenticate({
				baseUrl: baseUrl,
				headers: {
					authorization: "Basic some_token",
				},
			})
			.then((res) => {
				assert.equal(res, response.auth.status === 200);
			});
	});
});

describe("Limiter without options", () => {
	it("limiter without bottleneck options should have default settings", () => {
		const onfleet = new Onfleet({ apiKey });

		assert.equal(
			Onfleet.limiter._store.storeOptions.maxConcurrent,
			LIMITER_DEFAULT_MAX_CONCURRENT,
		);
		assert.equal(Onfleet.limiter._store.storeOptions.minTime, LIMITER_DEFAULT_MIN_TIME);
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

		assert.equal(
			Onfleet.limiter._store.storeOptions.maxConcurrent,
			LIMITER_DEFAULT_MAX_CONCURRENT,
		);
		assert.equal(Onfleet.limiter._store.storeOptions.minTime, LIMITER_DEFAULT_MIN_TIME);
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

		assert.equal(Onfleet.limiter._store.storeOptions.maxConcurrent, validMaxConcurrent);
		assert.equal(Onfleet.limiter._store.storeOptions.minTime, validMinTime);
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

		it("should retrieve administrators", () => {
			return onfleet.administrators.get().then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res[0].email, "james@onfleet.com");
				assert.equal(res[0].type, "super");
				assert.equal(res[1].email, "wrapper@onfleet.com");
				assert.equal(res[1].type, "standard");
			});
		});
	});

	describe("Get Tasks", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("tasks"))
				.reply(200, response.get);
		});

		it("should get task by ID", () => {
			return onfleet.tasks.get("SxD9Ran6pOfnUDgfTecTsgXd").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.id, "SxD9Ran6pOfnUDgfTecTsgXd");
				assert.equal(res.notes, "Onfleet API Wrappers!");
			});
		});

		it("should get task by ShortId", () => {
			return onfleet.tasks.get("44a56188", "shortId").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.shortId, "44a56188");
				assert.equal(res.trackingURL, "https://onf.lt/44a56188");
			});
		});
	});

	describe("Get Recipients", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("recipients"))
				.reply(200, response.getRecipients);
		});

		it("should get recipient by phone number", () => {
			return onfleet.recipients.get("+18881787788", "phone").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.phone, "+18881787788");
				assert.equal(res.skipSMSNotifications, false);
			});
		});

		it("should get recipient by name", () => {
			return onfleet.recipients.get("Onfleet Rocks", "name").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.name, "Onfleet Rocks");
			});
		});
	});

	describe("Create Team", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("teams"))
				.reply(200, response.createTeams);
		});

		it("should create a new team", () => {
			return onfleet.teams.create(newTeam).then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.name, "Onfleet Team");
			});
		});
	});

	describe("Get Team Worker ETA", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("teams"))
				.reply(200, response.getWorkerEta);
		});

		it("should get worker eta of a team", () => {
			return onfleet.teams.getWorkerEta("SxD9Ran6pOfnUDgfTecTsgXd", etaDetail).then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.steps[0].arrivalTime, 1621339297);
			});
		});
	});

	describe("Force Complete a Task", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("complete"))
				.reply(200, response.forceComplete);
		});

		it("should force complete a task", () => {
			return onfleet.tasks
				.forceComplete("6Fe3qqFZ0DDwsM86zBlHJtlJ", completionDetail)
				.then((res) => {
					expect(typeof res).to.equal("object");
					assert.equal(res.status, 200);
					assert.equal(res.completionDetails.notes, "Forced complete by Onfleet Wrapper");
				});
		});
	});

	describe("Update Worker", () => {
		beforeEach(() => {
			nock(baseUrl)
				.put((uri) => uri.includes("workers"))
				.reply(200, response.updateWorkers);
		});

		it("should update a worker", () => {
			return onfleet.workers.update("Mdfs*NDZ1*lMU0abFXAT82lM", updateDetail).then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.name, "Stephen Curry");
				assert.equal(res.phone, "+18883033030");
			});
		});
	});

	describe("Delete Task", () => {
		beforeEach(() => {
			nock(baseUrl)
				.delete((uri) => uri.includes("tasks"))
				.reply(200, response.deleteTask);
		});

		it("should delete a task", () => {
			return onfleet.tasks.deleteOne("AqzN6ZAq*qlSDJ0FzmZIMZz~").then((res) => {
				expect(typeof res).to.equal("number");
				assert.equal(res, 200);
			});
		});
	});

	describe("Get Unassigned Tasks in a Team", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("teams/K3FXFtJj2FtaO2~H60evRrDc/tasks"))
				.reply(200, response.getTeamUnassignedTasks);
		});

		it("should get unassigned tasks in a team", () => {
			return onfleet.teams.getTasks("K3FXFtJj2FtaO2~H60evRrDc").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.tasks.length, 1);
				assert.equal(res.tasks[0].id, "3VtEMGudjwjjM60j7deSI123");
			});
		});
	});

	describe("Get Assigned Tasks for a Worker", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("workers/ZxcnkJi~79nonYaMTQ960Mg2/tasks"))
				.reply(200, response.getWorkerAssignedTasks);
		});

		it("should get assigned tasks for a worker", () => {
			return onfleet.workers.getTasks("ZxcnkJi~79nonYaMTQ960Mg2").then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.tasks.length, 1);
				assert.equal(res.tasks[0].id, "3VtEMGudjwjjM60j7deSI987");
			});
		});
	});

	describe("Get Custom Fields", () => {
		beforeEach(() => {
			nock(baseUrl)
				.get((uri) => uri.includes("customFields"))
				.reply(200, response.getCustomFields);
		});

		it("should get custom fields", () => {
			return onfleet.customfields.get({ integration: "shopify" }).then((res) => {
				expect(typeof res).to.equal("object");
				assert.equal(res.fields.length, 1);
			});
		});
	});

	describe("Create Custom Field", () => {
		beforeEach(() => {
			nock(baseUrl)
				.post((uri) => uri.includes("customFields"))
				.reply(200, response.createCustomFields);
		});

		it("should create a custom field", () => {
			return onfleet.customfields.create(createCustomField).then((res) => {
				assert.equal(res, 200);
			});
		});
	});
});
