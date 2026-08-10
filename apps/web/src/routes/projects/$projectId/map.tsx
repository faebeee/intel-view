import { createFileRoute } from "@tanstack/react-router";
import { MapPin, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import { Button } from "#/components/ui/button.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { AllLocationsMap } from "#/features/map/components/AllLocationsMap.tsx";
import { useAllNoteLocationsQuery } from "#/features/notes/hooks/useAllNoteLocationsQuery.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";

export const Route = createFileRoute("/projects/$projectId/map")({
	component: MapRouteComponent,
});

function MapRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	const { data: project, isLoading: isProjectLoading } =
		useProjectQuery(projectId);
	const {
		data: locations = [],
		isLoading: isLocationsLoading,
		isRefetching,
		refetch,
	} = useAllNoteLocationsQuery(projectId);

	if (isProjectLoading) {
		return <LoadingState label="Loading project..." />;
	}

	if (!project) {
		return (
			<NotFoundState
				message={`Project #${projectIdParam} not found.`}
				backTo="/"
				backLabel="Back to Projects"
			/>
		);
	}

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-background/50 animate-fade-in">
			<div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 shrink-0">
				<div className="flex items-center gap-2">
					<MapPin className="h-5 w-5 text-palm" />
					<h1 className="text-lg font-bold text-sea-ink uppercase tracking-wider">
						Map
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLocationsLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isLocationsLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLocationsLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>
				</div>
			</div>

			{isLocationsLoading ? (
				<LoadingState label="Loading locations..." compact />
			) : locations.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
					<MapPin className="h-8 w-8 text-muted-foreground/40" />
					<p className="text-sm text-muted-foreground">
						No locations yet — insert one from a note's editor using the map pin
						toolbar button.
					</p>
				</div>
			) : (
				<AllLocationsMap
					projectId={projectIdParam}
					locations={locations}
					className="flex-1 min-h-0"
				/>
			)}
		</div>
	);
}
