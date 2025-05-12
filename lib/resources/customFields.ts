import Resource, { Api } from "../resource";

/**
 * Defines the CRUD operations available on the CustomFields endpoint
 */
export default class CustomFields extends Resource {
	constructor(api: Api) {
		super(api);
		// Use default API timeout
		this.defineTimeout(null);

		this.endpoints({
			create: {
				path: "/customFields",
				altPath: "/customFields",
				method: "POST",
			},
			get: {
				path: "/customFields/:modelName",
				altPath: "/customFields/Task",
				method: "GET",
				queryParams: true,
			},
			update: {
				path: "/customFields",
				altPath: "/customFields",
				method: "PUT",
			},
			delete: {
				path: "/customFields",
				altPath: "/customFields",
				method: "DELETE",
			},
		});
	}
}
