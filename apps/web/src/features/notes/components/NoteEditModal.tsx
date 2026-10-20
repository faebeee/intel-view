import type { NoteResponseDto as Note, TagResponseDto as Tag } from "@repo/sdk";
import { StickyNote } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "#/components/ui/dialog.tsx";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { NoteContentEditor } from "#/features/notes/components/NoteContentEditor.tsx";
import { NoteSettingsPanel } from "#/features/notes/components/NoteSettingsPanel.tsx";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useNoteDraftAutosave } from "#/features/notes/hooks/useNoteDraftAutosave.ts";
import {
	useAddNoteChild,
	useAddNoteParent,
	useRemoveNoteChild,
	useRemoveNoteParent,
} from "#/features/notes/hooks/useNoteRelationMutations.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { toastApiError } from "#/lib/api-error.ts";

export type NoteEditModalProps = {
	projectId: number;
	note: Note | null | undefined;
	notes: Note[];
	tags: Tag[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called after the note is successfully deleted from within the modal, so the caller can clear its selection and close the modal. */
	onDeleted?: () => void;
};

/**
 * Full-featured note editor rendered in a modal, so notes can be edited
 * in-place from the map/canvas views without navigating away to the
 * standalone notes page. Mirrors the notes page's center editor pane +
 * right settings panel layout.
 */
export function NoteEditModal({
	projectId,
	note,
	notes,
	tags,
	open,
	onOpenChange,
	onDeleted,
}: NoteEditModalProps): JSX.Element {
	const {
		draftTitle,
		draftContent,
		setDraftTitle,
		setDraftContent,
		saveStatus,
		initializedNoteId,
		updateNoteMutation,
	} = useNoteDraftAutosave(projectId, open ? (note ?? undefined) : undefined);

	const addNoteParentMutation = useAddNoteParent(projectId);
	const removeNoteParentMutation = useRemoveNoteParent(projectId);
	const addNoteChildMutation = useAddNoteChild(projectId);
	const removeNoteChildMutation = useRemoveNoteChild(projectId);
	const deleteNoteMutation = useDeleteNote(projectId);

	const handleAddParent = React.useCallback(
		(parentId: number) => {
			if (!note) return;
			addNoteParentMutation.mutate({ id: note.id, parentId });
		},
		[note, addNoteParentMutation],
	);

	const handleRemoveParent = React.useCallback(
		(parentId: number) => {
			if (!note) return;
			removeNoteParentMutation.mutate({ id: note.id, parentId });
		},
		[note, removeNoteParentMutation],
	);

	const handleAddChild = React.useCallback(
		(childId: number) => {
			if (!note) return;
			addNoteChildMutation.mutate({ id: note.id, childId });
		},
		[note, addNoteChildMutation],
	);

	const handleRemoveChild = React.useCallback(
		(childId: number) => {
			if (!note) return;
			removeNoteChildMutation.mutate({ id: note.id, childId });
		},
		[note, removeNoteChildMutation],
	);

	const handleTagsChange = React.useCallback(
		(nextTags: string[]) => {
			if (!note) return;
			updateNoteMutation.mutate(
				{ id: note.id, patch: { tags: nextTags } },
				{ onError: toastApiError("update note's tags") },
			);
		},
		[note, updateNoteMutation],
	);

	const handleColorChange = React.useCallback(
		(color: string | null) => {
			if (!note) return;
			updateNoteMutation.mutate(
				{ id: note.id, patch: { color } },
				{ onError: toastApiError("update note's color") },
			);
		},
		[note, updateNoteMutation],
	);

	const handleDelete = React.useCallback(() => {
		if (!note) return;
		deleteNoteMutation.mutate(note.id, {
			onSuccess: () => {
				onOpenChange(false);
				onDeleted?.();
			},
		});
	}, [note, deleteNoteMutation, onOpenChange, onDeleted]);

	const isReady = !!note && initializedNoteId === note.id;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl w-full max-h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
				<div className="flex items-center gap-2 px-4 py-3 border-b border-line shrink-0">
					<StickyNote className="h-4 w-4 text-palm shrink-0" />
					<DialogTitle className="text-sm font-bold text-sea-ink truncate">
						{note ? getNoteLabel(note) : "Edit note"}
					</DialogTitle>
				</div>

				{isReady && note ? (
					<div className="flex-1 min-h-0 flex">
						<div className="flex-1 min-w-0 border-r border-line">
							<NoteContentEditor
								projectId={projectId}
								note={note}
								notes={notes}
								title={draftTitle}
								content={draftContent}
								onTitleChange={setDraftTitle}
								onContentChange={setDraftContent}
								saveStatus={saveStatus}
								className="h-full"
							/>
						</div>

						<div className="w-72 shrink-0">
							<NoteSettingsPanel
								projectId={projectId}
								note={note}
								notes={notes}
								tags={tags}
								onAddParent={handleAddParent}
								onRemoveParent={handleRemoveParent}
								onAddChild={handleAddChild}
								onRemoveChild={handleRemoveChild}
								onTagsChange={handleTagsChange}
								onColorChange={handleColorChange}
								onDelete={handleDelete}
								isMutating={
									updateNoteMutation.isPending || deleteNoteMutation.isPending
								}
								className="h-full overflow-y-auto"
							/>
						</div>
					</div>
				) : (
					<LoadingState label="Loading note..." compact />
				)}
			</DialogContent>
		</Dialog>
	);
}
