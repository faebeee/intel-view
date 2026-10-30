import { createFileRoute } from "@tanstack/react-router";
import type { JSX } from "react";
import * as React from "react";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { CanvasView } from "#/features/canvas/components/CanvasView.tsx";
import { NoteDetailsPanel } from "#/features/notes/components/NoteDetailsPanel.tsx";
import { NoteEditModal } from "#/features/notes/components/NoteEditModal.tsx";
import { NoteTree } from "#/features/notes/components/NoteTree.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectCanvasRouteComponent,
});

function ProjectCanvasRouteComponent(): JSX.Element {
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

	// Bumped only when a note is picked from the sidebar, asking the canvas to
	// pan to it — selecting a node on the canvas itself leaves the viewport be.
	const [revealRequest, setRevealRequest] = React.useState(0);

	const selectedNote = React.useMemo(
		() => notes.find((note) => note.id === selectedNoteId) ?? null,
		[notes, selectedNoteId],
	);

	const deleteNoteMutation = useDeleteNote(projectId);

	const handleSelectFromSidebar = React.useCallback((noteId: number) => {
		setSelectedNoteId(noteId);
		setRevealRequest((previous) => previous + 1);
	}, []);

	const handleDeleteFromSidebar = React.useCallback(
		(noteId: number) => {
			deleteNoteMutation.mutate(noteId, {
				onSuccess: () => {
					setSelectedNoteId((current) => (current === noteId ? null : current));
				},
			});
		},
		[deleteNoteMutation],
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
		<div className="h-full w-full flex min-h-0 bg-background/50 animate-fade-in">
			<NoteTree
				notes={notes}
				tags={tags}
				selectedNoteId={selectedNote?.id}
				onSelect={handleSelectFromSidebar}
				onDelete={handleDeleteFromSidebar}
				isMutating={deleteNoteMutation.isPending}
				className="w-72 shrink-0 border-r border-line p-3"
			/>

			<div className="flex-1 min-w-0 relative">
				<CanvasView
					projectId={projectId}
					selectedNoteId={selectedNoteId}
					onSelectNote={setSelectedNoteId}
					revealRequest={revealRequest}
					onNoteDoubleClick={(noteId) => {
						setSelectedNoteId(noteId);
						setIsEditModalOpen(true);
					}}
					onNoteCreated={(noteId) => {
						setSelectedNoteId(noteId);
						setIsEditModalOpen(true);
					}}
				/>
			</div>

			{selectedNote && (
				<NoteDetailsPanel
					projectId={projectId}
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
