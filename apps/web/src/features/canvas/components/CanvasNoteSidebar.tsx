import type { NoteResponseDto as Note, TagResponseDto as Tag } from "@repo/sdk";
import { X } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import {
	type NoteSaveStatus,
	SaveStatusIndicator,
} from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteLogEditorPane } from "#/features/notes/components/NoteLogEditorPane.tsx";
import { NoteAddressEditorPane } from "#/features/notes/components/NoteAddressEditorPane.tsx";
import { NoteFileEditorPane } from "#/features/notes/components/NoteFileEditorPane.tsx";
import { NoteSettingsPanel } from "#/features/notes/components/NoteSettingsPanel.tsx";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import {
	useAddNoteChild,
	useAddNoteParent,
	useRemoveNoteChild,
	useRemoveNoteParent,
} from "#/features/notes/hooks/useNoteRelationMutations.ts";
import { cn } from "#/lib/utils.ts";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { useUpdateNote } from "../hooks/useUpdateNote";

const AUTOSAVE_DEBOUNCE_MS = 800;

type CanvasNoteSidebarProps = {
	projectId: number;
	note: Note;
	notes: Note[];
	tags: Tag[];
	onClose: () => void;
	onDeleted: () => void;
	className?: string;
};

/**
 * Editable sidebar shown on the canvas view whenever a note is selected.
 * Combines an autosaved title/content editor (or the log composer, for
 * `'log'`-type notes) with the same parent/tags/history/delete controls as
 * `NoteSettingsPanel`, so notes can be fully edited without leaving the
 * canvas.
 */
export function CanvasNoteSidebar({
	projectId,
	note,
	notes,
	tags,
	onClose,
	onDeleted,
	className,
}: CanvasNoteSidebarProps) {
	const updateNoteMutation = useUpdateNote(projectId);
	const deleteNoteMutation = useDeleteNote(projectId);
	const addNoteParentMutation = useAddNoteParent(projectId);
	const removeNoteParentMutation = useRemoveNoteParent(projectId);
	const addNoteChildMutation = useAddNoteChild(projectId);
	const removeNoteChildMutation = useRemoveNoteChild(projectId);

	const [draftTitle, setDraftTitle] = React.useState(note.title ?? "");
	const [draftContent, setDraftContent] = React.useState(note.content ?? "");
	const [saveStatus, setSaveStatus] = React.useState<NoteSaveStatus>("idle");
	const savedRef = React.useRef({
		title: note.title ?? "",
		content: note.content ?? "",
	});

	// Reset the local draft whenever a different note is selected. Keyed on
	// `note.id` only (not the whole `note` object) so a background refetch of
	// the same note doesn't clobber in-flight local edits.
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-initializes only when the selected note id changes
	React.useEffect(() => {
		setDraftTitle(note.title ?? "");
		setDraftContent(note.content ?? "");
		savedRef.current = { title: note.title ?? "", content: note.content ?? "" };
		setSaveStatus("idle");
	}, [note.id]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally depends on note.id (not the whole object) and omits the stable updateNoteMutation.mutate function
	React.useEffect(() => {
		if (
			draftTitle === savedRef.current.title &&
			draftContent === savedRef.current.content
		) {
			return;
		}

		setSaveStatus("saving");
		const timeout = setTimeout(() => {
			updateNoteMutation.mutate(
				{ id: note.id, payload: { title: draftTitle, content: draftContent } },
				{
					onSuccess: () => {
						savedRef.current = { title: draftTitle, content: draftContent };
						setSaveStatus("saved");
					},
					onError: () => setSaveStatus("error"),
				},
			);
		}, AUTOSAVE_DEBOUNCE_MS);

		return () => clearTimeout(timeout);
	}, [draftTitle, draftContent, note.id]);

	const noteOptions = React.useMemo(
		() => notes.map((n) => ({ id: n.id, label: getNoteLabel(n) })),
		[notes],
	);

	const handleAddParent = React.useCallback(
		(parentId: number) => {
			addNoteParentMutation.mutate({ id: note.id, parentId });
		},
		[addNoteParentMutation, note.id],
	);

	const handleRemoveParent = React.useCallback(
		(parentId: number) => {
			removeNoteParentMutation.mutate({ id: note.id, parentId });
		},
		[removeNoteParentMutation, note.id],
	);

	const handleAddChild = React.useCallback(
		(childId: number) => {
			addNoteChildMutation.mutate({ id: note.id, childId });
		},
		[addNoteChildMutation, note.id],
	);

	const handleRemoveChild = React.useCallback(
		(childId: number) => {
			removeNoteChildMutation.mutate({ id: note.id, childId });
		},
		[removeNoteChildMutation, note.id],
	);

	const handleTagsChange = React.useCallback(
		(nextTags: string[]) => {
			updateNoteMutation.mutate({ id: note.id, payload: { tags: nextTags } });
		},
		[updateNoteMutation, note.id],
	);

	const handleDelete = React.useCallback(() => {
		deleteNoteMutation.mutate(note.id, { onSuccess: onDeleted });
	}, [deleteNoteMutation, note.id, onDeleted]);

	return (
		<div className={cn("flex flex-col min-h-0", className)}>
			<div className="flex items-center justify-between gap-2 p-3 border-b border-line shrink-0">
				<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft truncate">
					{getNoteLabel(note)}
				</span>
				<Button variant="ghost" size="icon-xs" onClick={onClose} title="Close">
					<X className="h-3.5 w-3.5" />
				</Button>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 p-3">
				{note.type === "log" ? (
					<NoteLogEditorPane
						projectId={projectId}
						note={note}
						title={draftTitle}
						onTitleChange={setDraftTitle}
						saveStatus={saveStatus}
						notes={notes}
						className="h-auto min-h-0 overflow-visible p-0 shrink-0"
					/>
				) : note.type === "address" ? (
					<NoteAddressEditorPane
						projectId={projectId}
						note={note}
						title={draftTitle}
						onTitleChange={setDraftTitle}
						saveStatus={saveStatus}
						className="h-auto min-h-0 overflow-visible p-0 shrink-0"
					/>
				) : note.type === "file" ? (
					<NoteFileEditorPane
						projectId={projectId}
						note={note}
						title={draftTitle}
						onTitleChange={setDraftTitle}
						saveStatus={saveStatus}
						className="h-auto min-h-0 overflow-visible p-0 shrink-0"
					/>
				) : (
					<>
						<div className="flex items-center justify-between gap-2">
							<Input
								value={draftTitle}
								onChange={(e) => setDraftTitle(e.target.value)}
								placeholder="Untitled note"
								className="border-none bg-transparent px-1 text-sm font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
							/>
							<SaveStatusIndicator status={saveStatus} />
						</div>
						<MarkdownEditor
							value={draftContent}
							onChange={setDraftContent}
							notes={noteOptions}
							minHeight="min-h-48"
						/>
					</>
				)}

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
					onDelete={handleDelete}
					isMutating={
						updateNoteMutation.isPending || deleteNoteMutation.isPending
					}
					className="border-t border-line/50"
				/>
			</div>
		</div>
	);
}

export default CanvasNoteSidebar;
