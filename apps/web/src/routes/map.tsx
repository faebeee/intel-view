import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import { MapView } from "../features/map/components/MapView";

export const Route = createFileRoute("/map")({
	component: MapRouteComponent,
});

function MapRouteComponent(): JSX.Element {
	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col min-h-0 overflow-hidden">
			<MapView />
		</div>
	);
}
