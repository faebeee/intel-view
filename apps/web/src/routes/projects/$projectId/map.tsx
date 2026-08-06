import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { MapView } from "#/features/map/components/MapView.tsx";

export const Route = createFileRoute("/projects/$projectId/map")({
	component: MapRouteComponent,
});

function MapRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col min-h-0 overflow-hidden">
			<MapView projectId={projectId} />
		</div>
	);
}
