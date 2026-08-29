import { client } from "@repo/sdk/services.gen";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import assert from "assert";
import { ThemeProvider } from "#/components/theme-provider";
import { TooltipProvider } from "#/components/ui/tooltip";
import { ApiHealthGate } from "#/features/common/components/ApiHealthGate.tsx";
import { DEFAULT_COLOR_THEME } from "#/lib/theme";
import { getThemeCookies } from "#/lib/theme-cookies";
import { getLocale } from "#/paraglide/runtime";
import { Layout } from "../features/common/components/Layout";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		// Other redirect strategies are possible; see
		// https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#offline-redirect
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
	},

	loader: async () => {
		assert(process.env.VITE_API_URL, "VITE_API_URL is not defined");
		return {
			API_URL: process.env.VITE_API_URL,
			...(await getThemeCookies()),
		};
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Intel View - Location Notes Manager",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const config = Route.useLoaderData();
	client.setConfig({
		baseUrl: config.API_URL,
	});
	// "system" mode can't be resolved on the server, so we default to the
	// dark class (the site's original look) and let ThemeProvider correct it
	// client-side after hydration if the OS preference is actually light.
	const htmlClassName = config.mode === "light" ? "" : "dark";
	// The accent color palette is chosen per-project (see `Layout`), so we
	// render the default palette here and let a client effect apply the open
	// project's color once its data has loaded.
	return (
		<html
			lang={getLocale()}
			className={htmlClassName}
			data-theme={DEFAULT_COLOR_THEME}
			suppressHydrationWarning
		>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider initialMode={config.mode}>
					<TooltipProvider>
						<ApiHealthGate>
							<Layout>{children}</Layout>
						</ApiHealthGate>
					</TooltipProvider>
				</ThemeProvider>
				<TanStackDevtools
					config={{
						position: "top-right",
						hideUntilHover: true,
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
