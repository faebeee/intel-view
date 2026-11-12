import type { ProjectResponseDto } from "@repo/sdk";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListTree, Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable.tsx";
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
import { useRenderedNotes } from "#/features/notes/note-references.ts";
import { PhaseProgressBar } from "#/features/projects/components/PhaseProgressBar.tsx";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useUpdateProject } from "#/features/projects/hooks/useUpdateProject.ts";
import type { ProjectPhase } from "#/features/projects/phases.ts";
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
	// Display copies with `[[NOTEID]]` references resolved. Editors keep
	// using the raw `notes`/`selectedNote` so the original markup stays editable.
	const renderedNotes = useRenderedNotes(notes);
	const renderedSelectedNote = React.useMemo(
		() => renderedNotes.find((note) => note.id === selectedNoteId) ?? null,
		[renderedNotes, selectedNoteId],
	);

	const deleteNoteMutation = useDeleteNote(projectId);
	const queryClient = useQueryClient();
	const updateProjectMutation = useUpdateProject(projectId);

	// Optimistic: the bar moves at once and rolls back if the save fails.
	const handleSelectPhase = React.useCallback(
		(phase: ProjectPhase) => {
			const queryKey = ["projects", projectId];
			const previous = queryClient.getQueryData<ProjectResponseDto>(queryKey);
			if (previous) queryClient.setQueryData(queryKey, { ...previous, phase });
			updateProjectMutation.mutate(
				{ phase },
				{
					onError: () => {
						if (previous) queryClient.setQueryData(queryKey, previous);
					},
				},
			);
		},
		[projectId, queryClient, updateProjectMutation],
	);

	// The notes list is optional chrome here (the design has no sidebar), so
	// it starts collapsed and is toggled from the header.
	const [isTreeOpen, setIsTreeOpen] = React.useState(false);
	const [addNoteRequest, setAddNoteRequest] = React.useState(0);
	const [searchFocusRequest, setSearchFocusRequest] = React.useState(0);
	const isFetchingNotes = useIsFetching({ queryKey: ["notes"] }) > 0;

	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: "project-canvas-panels",
		panelIds: selectedNote
			? ["canvas-panel", "inspector-panel"]
			: ["canvas-panel"],
		storage: typeof window === "undefined" ? undefined : window.localStorage,
	});

	const handleSelectFromSidebar = React.useCallback((noteId: number) => {
		setSelectedNoteId(noteId);
		setRevealRequest((previous) => previous + 1);
	}, []);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target as HTMLElement).isContentEditable
			) {
				return;
			}

			if (event.key === "n" && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				setAddNoteRequest((n) => n + 1);
			} else if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
				event.preventDefault();
				setIsTreeOpen(true);
				setSearchFocusRequest((n) => n + 1);
			} else if (event.key === "Enter" && selectedNoteId) {
				event.preventDefault();
				setIsEditModalOpen(true);
			} else if (
				(event.key === "Backspace" || event.key === "Delete") &&
				selectedNoteId
			) {
				event.preventDefault();
				deleteNoteMutation.mutate(selectedNoteId, {
					onSuccess: () => {
						setSelectedNoteId(null);
					},
				});
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [selectedNoteId, deleteNoteMutation]);

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
				>
					<PhaseProgressBar
						phase={project.phase}
						onSelectPhase={handleSelectPhase}
					/>
				</PageHeader>
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
					notes={renderedNotes}
					tags={tags}
					selectedNoteId={selectedNote?.id}
					onSelect={handleSelectFromSidebar}
					onDelete={handleDeleteFromSidebar}
					isMutating={deleteNoteMutation.isPending}
					className="w-72 shrink-0 border-r border-mc-border bg-mc-rail p-3 max-sm:h-80 max-sm:w-full max-sm:border-r-0 max-sm:border-b"
					searchFocusRequest={searchFocusRequest}
				/>
			)}

			<ResizablePanelGroup
				orientation="horizontal"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
				className="min-h-[480px] min-w-0 flex-[999_1_600px] max-sm:flex-col"
			>
				<ResizablePanel id="canvas-panel" defaultSize="75" minSize="30">
					<section
						aria-label="Note graph"
						className="relative h-full min-h-[480px] overflow-hidden"
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
				</ResizablePanel>

				{renderedSelectedNote && (
					<>
						<ResizableHandle withHandle />
						<ResizablePanel
							id="inspector-panel"
							defaultSize="25"
							minSize="18"
							maxSize="40"
						>
							<NoteDetailsPanel
								projectId={projectId}
								note={renderedSelectedNote}
								notes={renderedNotes}
								onClose={() => setSelectedNoteId(null)}
								onEdit={() => setIsEditModalOpen(true)}
								onDeleted={() => setSelectedNoteId(null)}
								className="h-full min-w-[300px] border-l border-mc-border max-sm:h-auto max-sm:border-t max-sm:border-l-0"
							/>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>

			<NoteEditModal
				projectId={projectId}
				note={selectedNote}
				notes={renderedNotes}
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
