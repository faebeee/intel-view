import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

export const Route = createFileRoute("/notes")({
	component: NotesRouteComponent,
});

function NotesRouteComponent(): JSX.Element {
	return <Outlet />;
}
