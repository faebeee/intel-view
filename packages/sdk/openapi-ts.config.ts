import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	client: "@hey-api/client-fetch",
	input: "http://localhost:4010/docs-json",
	output: "./src/generated",
});
