import { noteControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw, StickyNote } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import { NoteContentEditor } from "#/features/notes/components/NoteContentEditor.tsx";
import { NoteSettingsPanel } from "#/features/notes/components/NoteSettingsPanel.tsx";
import { NoteTree } from "#/features/notes/components/NoteTree.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useCreateNote } from "#/features/notes/hooks/useCreateNote.ts";
import { useNoteDraftAutosave } from "#/features/notes/hooks/useNoteDraftAutosave.ts";
import {
	useAddNoteChild,
	useAddNoteParent,
	useRemoveNoteChild,
	useRemoveNoteParent,
} from "#/features/notes/hooks/useNoteRelationMutations.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";
import type { NoteType } from "#/types/note.ts";

type NotesSearch = {
	noteId?: number;
};

export const Route = createFileRoute("/projects/$projectId/notes")({
	validateSearch: (search: Record<string, unknown>): NotesSearch => ({
		noteId:
			typeof search.noteId === "number"
				? search.noteId
				: typeof search.noteId === "string" && search.noteId !== ""
					? Number(search.noteId)
					: undefined,
	}),
	component: NotesRouteComponent,
});

function NotesRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);
	const { noteId: selectedNoteId } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const queryClient = useQueryClient();

	const { data: project, isLoading: isProjectLoading } =
		useProjectQuery(projectId);
	const {
		data: notes = [],
		isLoading: isNotesLoading,
		isRefetching,
		refetch,
	} = useAllNotesQuery(projectId);
	const { data: tags = [] } = useAllTagsQuery();

	const selectedNote = React.useMemo(
		() => notes.find((n) => n.id === selectedNoteId),
		[notes, selectedNoteId],
	);

	const selectNote = React.useCallback(
		(id: number | undefined) => {
			navigate({ search: (prev) => ({ ...prev, noteId: id }), replace: true });
		},
		[navigate],
	);

	const invalidateNotes = React.useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
	}, [queryClient, projectId]);

	// --- New note dialog -----------------------------------------------------

	const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
	const [createDialogParentId, setCreateDialogParentId] = React.useState<
		number | null
	>(null);

	const openCreateDialog = React.useCallback((parentId: number | null) => {
		setCreateDialogParentId(parentId);
		setIsCreateDialogOpen(true);
	}, []);

	// --- Mutations ---------------------------------------------------------

	const createNoteMutation = useCreateNote(projectId);

	const handleCreateNote = (type: NoteType) => {
		createNoteMutation.mutate(
			{ parentId: createDialogParentId, type },
			{
				onSuccess: (note) => {
					invalidateNotes();
					selectNote(note.id);
					setIsCreateDialogOpen(false);
				},
			},
		);
	};

	const addNoteParentMutation = useAddNoteParent(projectId);
	const removeNoteParentMutation = useRemoveNoteParent(projectId);
	const addNoteChildMutation = useAddNoteChild(projectId);
	const removeNoteChildMutation = useRemoveNoteChild(projectId);

	const deleteNoteMutation = useMutation({
		mutationFn: async (id: number) => {
			await noteControllerRemove({ path: { projectId, id } });
			return id;
		},
		onSuccess: (id) => {
			toast.success("Note deleted successfully");
			invalidateNotes();
			if (selectedNoteId === id) {
				selectNote(undefined);
			}
		},
		onError: toastApiError("delete note"),
	});

	// --- Autosaved title/content draft --------------------------------------

	const {
		draftTitle,
		draftContent,
		setDraftTitle,
		setDraftContent,
		saveStatus,
		initializedNoteId,
		updateNoteMutation,
	} = useNoteDraftAutosave(projectId, selectedNote);

	// --- Handlers ------------------------------------------------------------

	const handleAddParent = (parentId: number) => {
		if (!selectedNote) return;
		addNoteParentMutation.mutate({ id: selectedNote.id, parentId });
	};

	const handleRemoveParent = (parentId: number) => {
		if (!selectedNote) return;
		removeNoteParentMutation.mutate({ id: selectedNote.id, parentId });
	};

	const handleAddChild = (childId: number) => {
		if (!selectedNote) return;
		addNoteChildMutation.mutate({ id: selectedNote.id, childId });
	};

	const handleRemoveChild = (childId: number) => {
		if (!selectedNote) return;
		removeNoteChildMutation.mutate({ id: selectedNote.id, childId });
	};

	const handleTagsChange = (nextTags: string[]) => {
		if (!selectedNote) return;
		updateNoteMutation.mutate(
			{ id: selectedNote.id, patch: { tags: nextTags } },
			{ onError: toastApiError("update note's tags") },
		);
	};

	const handleColorChange = (color: string | null) => {
		if (!selectedNote) return;
		updateNoteMutation.mutate(
			{ id: selectedNote.id, patch: { color } },
			{ onError: toastApiError("update note's color") },
		);
	};

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
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-background/50 animate-fade-in">
			<div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 shrink-0">
				<div className="flex items-center gap-2">
					<StickyNote className="h-5 w-5 text-palm" />
					<h1 className="text-lg font-bold text-sea-ink uppercase tracking-wider">
						Notes
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isNotesLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isNotesLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isNotesLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={() => openCreateDialog(null)}
						disabled={createNoteMutation.isPending}
					>
						<Plus className="h-4 w-4" />
						<span>Add Note</span>
					</Button>
				</div>
			</div>

			{isNotesLoading ? (
				<LoadingState label="Loading notes..." compact />
			) : (
				<div className="flex-1 min-h-0 flex">
					<div className="w-64 shrink-0 border-r border-line">
						<NoteTree
							notes={notes}
							tags={tags}
							selectedNoteId={selectedNote?.id}
							onSelect={selectNote}
							onCreateChild={(parentId) => openCreateDialog(parentId)}
							onDelete={(id) => deleteNoteMutation.mutate(id)}
							isMutating={
								createNoteMutation.isPending || deleteNoteMutation.isPending
							}
							className="h-full p-3"
						/>
					</div>

					<div className="flex-1 min-w-0">
						{selectedNote && initializedNoteId === selectedNote.id ? (
							<NoteContentEditor
								projectId={projectId}
								note={selectedNote}
								notes={notes}
								title={draftTitle}
								content={draftContent}
								onTitleChange={setDraftTitle}
								onContentChange={setDraftContent}
								saveStatus={saveStatus}
								className="h-full"
							/>
						) : selectedNoteId !== undefined ? (
							<LoadingState label="Loading note..." compact />
						) : (
							<div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
								<StickyNote className="h-8 w-8 text-muted-foreground/40" />
								<p className="text-sm text-muted-foreground">
									Select a note from the tree, or create a new one to get
									started.
								</p>
							</div>
						)}
					</div>

					<div className="w-72 shrink-0 border-l border-line">
						{selectedNote && initializedNoteId === selectedNote.id ? (
							<NoteSettingsPanel
								projectId={projectId}
								note={selectedNote}
								notes={notes}
								tags={tags}
								onAddParent={handleAddParent}
								onRemoveParent={handleRemoveParent}
								onAddChild={handleAddChild}
								onRemoveChild={handleRemoveChild}
								onTagsChange={handleTagsChange}
								onColorChange={handleColorChange}
								onDelete={() => deleteNoteMutation.mutate(selectedNote.id)}
								isMutating={
									updateNoteMutation.isPending || deleteNoteMutation.isPending
								}
								className="h-full overflow-y-auto"
							/>
						) : null}
					</div>
				</div>
			)}

			<CreateNoteModal
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onCreate={handleCreateNote}
				isCreating={createNoteMutation.isPending}
			/>
		</div>
	);
}
