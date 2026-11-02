import { paraglideVitePlugin } from "@inlang/paraglide-js";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts so tests don't boot TanStack Start/Nitro.
export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		paraglideVitePlugin({
			project: "./project.inlang",
			outdir: "./src/paraglide",
			strategy: ["baseLocale"],
		}),
		viteReact(),
	],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.test.{ts,tsx}"],
	},
});
