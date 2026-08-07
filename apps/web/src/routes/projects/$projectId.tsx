import { createFileRoute, Outlet } from "@tanstack/react-router";
import type { JSX } from "react";
import { NoteReferenceProvider } from "#/features/notes/context/NoteReferenceContext.tsx";
import { NoteReferenceSheet } from "#/features/notes/components/NoteReferenceSheet.tsx";

export const Route = createFileRoute("/projects/$projectId")({
	component: ProjectLayoutComponent,
});

function ProjectLayoutComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	return (
		<NoteReferenceProvider projectId={projectId}>
			<Outlet />
			<NoteReferenceSheet />
		</NoteReferenceProvider>
	);
}
