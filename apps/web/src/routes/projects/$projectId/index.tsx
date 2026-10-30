import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListTree, Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { CanvasView } from "#/features/canvas/components/CanvasView.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import {
	PageHeader,
	PageShell,
	StatusBar,
} from "#/features/common/components/PageShell.tsx";
import { NoteDetailsPanel } from "#/features/notes/components/NoteDetailsPanel.tsx";
import { NoteEditModal } from "#/features/notes/components/NoteEditModal.tsx";
import { NoteTree } from "#/features/notes/components/NoteTree.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { formatIsoDateTime } from "#/lib/format.ts";
import { cn } from "#/lib/utils.ts";

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
	const queryClient = useQueryClient();

	// The notes list is optional chrome here (the design has no sidebar), so
	// it starts collapsed and is toggled from the header.
	const [isTreeOpen, setIsTreeOpen] = React.useState(false);
	const [addNoteRequest, setAddNoteRequest] = React.useState(0);
	const isFetchingNotes = useIsFetching({ queryKey: ["notes"] }) > 0;

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
				backLabel="Back to Folders"
			/>
		);
	}

	const linkCount = notes.reduce(
		(sum, note) => sum + (note.childIds?.length ?? 0),
		0,
	);
	const lastUpdated = notes.reduce<string | null>(
		(latest, note) =>
			!latest || note.updatedAt > latest ? note.updatedAt : latest,
		null,
	);

	return (
		<PageShell
			contentClassName="flex flex-wrap p-0 max-sm:p-0 bg-mc-bg"
			header={
				<PageHeader
					className="px-6 pt-4 pb-3.5"
					crumbs={[
						{ label: "Folders", to: "/" },
						project.folder
							? {
									label: project.folder.name,
									to: "/folders/$folderId",
									params: { folderId: String(project.folder.id) },
								}
							: { label: "Ungrouped", to: "/folders/ungrouped" },
						{ label: project.name },
					]}
					title={project.name}
					actions={
						<>
							<McButton
								variant="icon"
								size="icon-md"
								aria-pressed={isTreeOpen}
								aria-controls="canvas-notes-list"
								aria-label={isTreeOpen ? "Hide notes list" : "Show notes list"}
								title={isTreeOpen ? "Hide notes list" : "Show notes list"}
								onClick={() => setIsTreeOpen((open) => !open)}
								className={cn(isTreeOpen && "border-mc-accent text-mc-accent")}
							>
								<ListTree />
							</McButton>
							<McButton
								variant="icon"
								size="icon-md"
								aria-label="Refresh notes"
								title="Refresh notes"
								disabled={isFetchingNotes}
								onClick={() =>
									queryClient.invalidateQueries({ queryKey: ["notes"] })
								}
							>
								<RefreshCw className={isFetchingNotes ? "animate-spin" : ""} />
							</McButton>
							<McButton
								variant="primary"
								onClick={() => setAddNoteRequest((n) => n + 1)}
							>
								<Plus strokeWidth={2.2} />
								New note
							</McButton>
						</>
					}
				/>
			}
			status={
				<StatusBar
					items={[
						`${notes.length} ${notes.length === 1 ? "note" : "notes"}`,
						`${linkCount} ${linkCount === 1 ? "link" : "links"}`,
					]}
					right={
						lastUpdated
							? `Updated ${formatIsoDateTime(lastUpdated)}`
							: undefined
					}
				/>
			}
		>
			{isTreeOpen && (
				<NoteTree
					id="canvas-notes-list"
					notes={notes}
					tags={tags}
					selectedNoteId={selectedNote?.id}
					onSelect={handleSelectFromSidebar}
					onDelete={handleDeleteFromSidebar}
					isMutating={deleteNoteMutation.isPending}
					className="w-72 shrink-0 border-r border-mc-border bg-mc-rail p-3 max-sm:h-80 max-sm:w-full max-sm:border-r-0 max-sm:border-b"
				/>
			)}

			<section
				aria-label="Note graph"
				className="relative h-full min-h-[480px] min-w-0 flex-[999_1_600px] overflow-hidden"
			>
				<CanvasView
					projectId={projectId}
					selectedNoteId={selectedNoteId}
					onSelectNote={setSelectedNoteId}
					revealRequest={revealRequest}
					addNoteRequest={addNoteRequest}
					onNoteDoubleClick={(noteId) => {
						setSelectedNoteId(noteId);
						setIsEditModalOpen(true);
					}}
					onNoteCreated={(noteId) => {
						setSelectedNoteId(noteId);
						setIsEditModalOpen(true);
					}}
				/>
			</section>

			{selectedNote && (
				<NoteDetailsPanel
					projectId={projectId}
					note={selectedNote}
					notes={notes}
					onClose={() => setSelectedNoteId(null)}
					onEdit={() => setIsEditModalOpen(true)}
					onDeleted={() => setSelectedNoteId(null)}
					className="h-full min-w-[300px] max-w-[380px] flex-[1_1_340px] border-l border-mc-border max-sm:h-auto max-sm:max-w-none max-sm:border-t max-sm:border-l-0"
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
		</PageShell>
	);
}
