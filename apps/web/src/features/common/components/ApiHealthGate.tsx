import { healthControllerCheck } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { Button } from "#/components/ui/button.tsx";

const HEALTH_CHECK_INTERVAL_MS = 10_000;

type ApiHealthGateProps = {
	children: ReactNode;
};

/**
 * Top-level gate that blocks rendering of the entire app until the API (and
 * its database connection, see `apps/api/src/features/health`) is confirmed
 * reachable. While unhealthy, keeps polling in the background so the app
 * recovers automatically once the API comes back up, without requiring a
 * manual reload.
 */
export function ApiHealthGate({ children }: ApiHealthGateProps): JSX.Element {
	const { isLoading, isError, refetch, isRefetching } = useQuery({
		queryKey: ["health"],
		queryFn: async () => {
			const response = await healthControllerCheck({ throwOnError: true });
			return response.data;
		},
		retry: false,
		refetchOnWindowFocus: false,
		refetchInterval: (query) =>
			query.state.status === "error" ? HEALTH_CHECK_INTERVAL_MS : false,
	});

	if (isLoading) {
		return (
			<div className="flex min-h-screen w-full flex-col items-center justify-center gap-2 bg-background font-mono text-xs text-[#00f2ff]">
				<div className="animate-pulse flex flex-col items-center gap-2">
					<span>Connecting to API...</span>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex min-h-screen w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center">
				<AlertTriangle className="h-10 w-10 text-red-400" />
				<div className="flex flex-col gap-1">
					<h1 className="font-mono text-sm font-bold uppercase tracking-wider text-red-400">
						API Unreachable
					</h1>
					<p className="max-w-sm font-mono text-xs text-muted-foreground">
						Intel View can't reach the API right now. Retrying
						automatically in the background&mdash;you can also retry
						manually below.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => refetch()}
					disabled={isRefetching}
				>
					<RefreshCw
						className={`h-3 w-3 ${isRefetching ? "animate-spin" : ""}`}
					/>
					<span>{isRefetching ? "Retrying..." : "Retry Now"}</span>
				</Button>
			</div>
		);
	}

	return <>{children}</>;
}
