import type { NoteResponseDto as Note } from "@repo/sdk";
import {
	noteControllerCreate,
	noteControllerRemove,
	noteControllerUpdate,
} from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw, StickyNote } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteEditorPane } from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteLogEditorPane } from "#/features/notes/components/NoteLogEditorPane.tsx";
import { NoteSettingsPanel } from "#/features/notes/components/NoteSettingsPanel.tsx";
import { NoteTree } from "#/features/notes/components/NoteTree.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";
import type { NoteType } from "#/types/note.ts";

const AUTOSAVE_DEBOUNCE_MS = 800;

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
	const { data: tags = [] } = useAllTagsQuery(projectId);

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

	const invalidateNoteHistory = React.useCallback(
		(id: number) => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "history", projectId, id],
			});
		},
		[queryClient, projectId],
	);

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

	const createNoteMutation = useMutation({
		mutationFn: async (args: { parentId: number | null; type: NoteType }) => {
			const res = await noteControllerCreate({
				path: { projectId },
				body: {
					title: "",
					content: "",
					parentId: args.parentId,
					type: args.type,
				},
			});
			return res.data as Note;
		},
		onSuccess: (note) => {
			invalidateNotes();
			selectNote(note.id);
			setIsCreateDialogOpen(false);
		},
		onError: toastApiError("create note"),
	});

	const handleCreateNote = (type: NoteType) => {
		createNoteMutation.mutate({ parentId: createDialogParentId, type });
	};

	const updateNoteMutation = useMutation({
		mutationFn: async (args: {
			id: number;
			patch: Partial<Pick<Note, "title" | "content" | "tags" | "parentId">>;
		}) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: args.id },
				body: args.patch,
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => {
			invalidateNotes();
			invalidateNoteHistory(variables.id);
		},
	});

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

	const [draftTitle, setDraftTitle] = React.useState("");
	const [draftContent, setDraftContent] = React.useState("");
	const [saveStatus, setSaveStatus] = React.useState<NoteSaveStatus>("idle");
	const savedRef = React.useRef<{ title: string; content: string }>({
		title: "",
		content: "",
	});
	// Tracks which note id the draft state was last initialized from. Used
	// to distinguish "note not loaded yet" (wait, don't clobber the draft
	// with an empty value) from "already-initialized note refetched in the
	// background" (also don't clobber - preserves in-flight local edits)
	// from "user selected a different note, or this note just finished
	// loading for the first time" (do (re)initialize).
	const [initializedNoteId, setInitializedNoteId] = React.useState<
		number | undefined
	>(undefined);

	React.useEffect(() => {
		if (selectedNoteId === undefined) {
			setInitializedNoteId(undefined);
			setDraftTitle("");
			setDraftContent("");
			savedRef.current = { title: "", content: "" };
			setSaveStatus("idle");
			return;
		}

		// Already initialized the draft for this exact note id - a background
		// refetch returning the same note shouldn't clobber in-flight edits.
		if (initializedNoteId === selectedNoteId) return;

		// The note hasn't loaded yet (e.g. right after selecting it, or on a
		// fresh page load with a deep-linked `noteId`). Wait for the real data
		// instead of resetting the draft to empty, which would otherwise show
		// (and could autosave) blank content over the note's real content.
		if (!selectedNote) return;

		setDraftTitle(selectedNote.title ?? "");
		setDraftContent(selectedNote.content ?? "");
		savedRef.current = {
			title: selectedNote.title ?? "",
			content: selectedNote.content ?? "",
		};
		setSaveStatus("idle");
		setInitializedNoteId(selectedNoteId);
	}, [selectedNoteId, selectedNote, initializedNoteId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally depends on selectedNote.id (not the whole object) and omits the stable updateNoteMutation.mutate function
	React.useEffect(() => {
		if (!selectedNote) return;
		// Guards against autosaving before the draft has actually been
		// initialized from this note's real data (see the effect above) - a
		// belt-and-suspenders check against ever persisting a spuriously
		// empty draft over real content.
		if (initializedNoteId !== selectedNote.id) return;
		if (
			draftTitle === savedRef.current.title &&
			draftContent === savedRef.current.content
		) {
			return;
		}

		setSaveStatus("saving");
		const timeout = setTimeout(() => {
			updateNoteMutation.mutate(
				{
					id: selectedNote.id,
					patch: { title: draftTitle, content: draftContent },
				},
				{
					onSuccess: () => {
						savedRef.current = { title: draftTitle, content: draftContent };
						setSaveStatus("saved");
					},
					onError: (error) => {
						toastApiError("save note")(error);
						setSaveStatus("error");
					},
				},
			);
		}, AUTOSAVE_DEBOUNCE_MS);

		return () => clearTimeout(timeout);
	}, [draftTitle, draftContent, selectedNote?.id, initializedNoteId]);

	// --- Handlers ------------------------------------------------------------

	const handleParentChange = (parentId: number | null) => {
		if (!selectedNote) return;
		updateNoteMutation.mutate(
			{ id: selectedNote.id, patch: { parentId } },
			{ onError: toastApiError("update note's parent") },
		);
	};

	const handleTagsChange = (nextTags: string[]) => {
		if (!selectedNote) return;
		updateNoteMutation.mutate(
			{ id: selectedNote.id, patch: { tags: nextTags } },
			{ onError: toastApiError("update note's tags") },
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
							selectedNote.type === "log" ? (
								<NoteLogEditorPane
									projectId={projectId}
									note={selectedNote}
									title={draftTitle}
									onTitleChange={setDraftTitle}
									saveStatus={saveStatus}
									notes={notes}
									className="h-full"
								/>
							) : (
								<NoteEditorPane
									title={draftTitle}
									content={draftContent}
									onTitleChange={setDraftTitle}
									onContentChange={setDraftContent}
									notes={notes}
									saveStatus={saveStatus}
									className="h-full"
								/>
							)
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
								onParentChange={handleParentChange}
								onTagsChange={handleTagsChange}
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
