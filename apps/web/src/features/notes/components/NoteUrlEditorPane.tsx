import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	AlertTriangle,
	ExternalLink,
	Link as LinkIcon,
	Save,
} from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { SaveStatusIndicator } from "#/features/notes/components/NoteEditorPane.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";

type NoteUrlEditorPaneProps = {
	projectId: number;
	note: Note;
	title: string;
	onTitleChange: (title: string) => void;
	saveStatus: NoteSaveStatus;
	disabled?: boolean;
	className?: string;
};

/** Returns a user-facing error message if `value` isn't a well-formed http(s) URL, or `null` if it's valid (empty is allowed — a url note's content can be unset). */
function validateUrl(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	let parsed: URL;
	try {
		parsed = new URL(trimmed);
	} catch {
		return "That doesn't look like a valid URL";
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return "URL must start with http:// or https://";
	}
	return null;
}

/**
 * Center-column pane for `'url'`-type notes: the title input (same
 * autosave-driven control shared with the other panes) plus an editable URL
 * text field with an explicit Save button — unlike standard note content,
 * saving is validated client-side (and re-validated server-side) as a
 * well-formed `http(s)://` URL before being persisted, so it isn't
 * autosaved on every keystroke. Below the input, the saved URL is rendered
 * as a clickable link preview card.
 */
export function NoteUrlEditorPane({
	projectId,
	note,
	title,
	onTitleChange,
	saveStatus,
	disabled = false,
	className,
}: NoteUrlEditorPaneProps) {
	const queryClient = useQueryClient();
	const [draftUrl, setDraftUrl] = React.useState(note.content ?? "");
	const [initializedNoteId, setInitializedNoteId] = React.useState(note.id);

	// Re-initialize the draft whenever the selected note changes, without
	// clobbering in-flight edits on background refetches of the same note.
	React.useEffect(() => {
		if (initializedNoteId === note.id) return;
		setDraftUrl(note.content ?? "");
		setInitializedNoteId(note.id);
	}, [note.id, note.content, initializedNoteId]);

	const updateUrlMutation = useMutation({
		mutationFn: async (content: string) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: note.id },
				body: { content },
			});
			return res.data as Note;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "all", projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["notes", "history", projectId, note.id],
			});
		},
		onError: toastApiError("save link"),
	});

	const trimmedDraft = draftUrl.trim();
	const hasUnsavedChanges = trimmedDraft !== (note.content ?? "").trim();
	const validationError = validateUrl(draftUrl);

	const handleSave = () => {
		if (updateUrlMutation.isPending || validationError) return;
		updateUrlMutation.mutate(draftUrl);
	};

	const savedUrl = (note.content ?? "").trim();

	return (
		<div
			className={cn(
				"flex flex-col gap-4 h-full min-h-0 p-4 overflow-y-auto",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3 shrink-0">
				<Input
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Untitled link"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<div className="flex flex-col gap-2 shrink-0">
				<label
					htmlFor="note-url-input"
					className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
				>
					URL
				</label>
				<div className="flex items-center gap-2">
					<Input
						id="note-url-input"
						value={draftUrl}
						onChange={(e) => setDraftUrl(e.target.value)}
						placeholder="https://example.com"
						disabled={disabled || updateUrlMutation.isPending}
					/>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={
							disabled ||
							!hasUnsavedChanges ||
							!!validationError ||
							updateUrlMutation.isPending
						}
					>
						<Save className="h-3.5 w-3.5" />
						<span>{updateUrlMutation.isPending ? "Saving..." : "Save"}</span>
					</Button>
				</div>
				{hasUnsavedChanges && validationError && (
					<div className="flex items-start gap-2 text-xs text-red-400">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
						<span>{validationError}</span>
					</div>
				)}
			</div>

			<div className="flex-1 min-h-0 border-t border-line/50 pt-3">
				{savedUrl ? (
					<a
						href={savedUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 rounded-lg border border-line/50 p-3 text-sm text-palm hover:bg-surface-strong/60 transition-colors break-all"
					>
						<LinkIcon className="h-4 w-4 shrink-0" />
						<span className="flex-1">{savedUrl}</span>
						<ExternalLink className="h-3.5 w-3.5 shrink-0" />
					</a>
				) : (
					<p className="text-xs text-muted-foreground">
						Enter a URL above and save to set this note's link.
					</p>
				)}
			</div>
		</div>
	);
}
