import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { CanvasView } from "#/features/canvas/components/CanvasView.tsx";

export const Route = createFileRoute("/projects/$projectId/canvas")({
	component: CanvasRouteComponent,
});

function CanvasRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col min-h-0 overflow-hidden">
			<CanvasView projectId={projectId} />
		</div>
	);
}
