import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import * as React from "react";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { CanvasView } from "#/features/canvas/components/CanvasView.tsx";
import { NoteDetailsPanel } from "#/features/notes/components/NoteDetailsPanel.tsx";
import { NoteEditModal } from "#/features/notes/components/NoteEditModal.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

export const Route = createFileRoute("/projects/$projectId/canvas")({
	component: CanvasRouteComponent,
});

function CanvasRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	const { data: project, isLoading: isProjectLoading } =
		useProjectQuery(projectId);
	const { data: notes = [] } = useAllNotesQuery(projectId);
	const { data: tags = [] } = useAllTagsQuery();

	const [selectedNoteId, setSelectedNoteId] = React.useState<number | null>(
		null,
	);
	const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

	const selectedNote = React.useMemo(
		() => notes.find((note) => note.id === selectedNoteId) ?? null,
		[notes, selectedNoteId],
	);

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
		<div className="h-[calc(100vh-4rem)] w-full flex min-h-0 bg-background/50 animate-fade-in">
			<div className="flex-1 min-w-0 relative">
				<CanvasView
					projectId={projectId}
					selectedNoteId={selectedNoteId}
					onSelectNote={setSelectedNoteId}
					onNoteDoubleClick={(noteId) => {
						setSelectedNoteId(noteId);
						setIsEditModalOpen(true);
					}}
				/>
			</div>

			{selectedNote && (
				<NoteDetailsPanel
					projectId={projectId}
					projectIdParam={projectIdParam}
					note={selectedNote}
					notes={notes}
					onClose={() => setSelectedNoteId(null)}
					onEdit={() => setIsEditModalOpen(true)}
					onDeleted={() => setSelectedNoteId(null)}
					className="w-80 shrink-0 border-l border-line"
				/>
			)}

			<NoteEditModal
				projectId={projectId}
				note={selectedNote}
				notes={notes}
				tags={tags}
				open={isEditModalOpen && !!selectedNote}
				onOpenChange={setIsEditModalOpen}
				onDeleted={() => {
					setIsEditModalOpen(false);
					setSelectedNoteId(null);
				}}
			/>
		</div>
	);
}
