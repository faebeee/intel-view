import { defineConfig } from "@hey-api/openapi-ts";
require('dotenv').config()

export default defineConfig({
  input: `${process.env.NITRO_API_URL}/docs-json`,
  client: {
    name: '@hey-api/client-fetch'
  },
  output: "./client",
});
