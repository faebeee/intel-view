import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";

export const Route = createFileRoute("/projects/$projectId")({
	component: ProjectLayoutComponent,
});

function ProjectLayoutComponent(): JSX.Element {
	return <Outlet />;
}
