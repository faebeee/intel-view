import { healthControllerCheck } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { LoadingState, StatePanel } from "#/components/ui/loading-state.tsx";
import { McButton } from "./McButton";

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
			<div className="flex min-h-screen w-full bg-mc-bg">
				<LoadingState label="Connecting to API..." />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="bg-blueprint flex min-h-screen w-full items-center justify-center">
				<StatePanel
					tone="danger"
					icon={<AlertTriangle className="size-6 text-mc-danger-text" />}
					title="API unreachable"
					description="Intel View can't reach the API right now. Retrying automatically in the background. You can also retry manually."
					action={
						<McButton
							onClick={() => refetch()}
							disabled={isRefetching}
							size="lg"
						>
							<RefreshCw className={isRefetching ? "animate-spin" : ""} />
							{isRefetching ? "Retrying..." : "Retry now"}
						</McButton>
					}
				/>
			</div>
		);
	}

	return <>{children}</>;
}
