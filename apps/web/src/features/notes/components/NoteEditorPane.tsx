import type { NoteResponseDto as Note } from "@repo/sdk";
import { Check, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { cn } from "#/lib/utils.ts";

export type NoteSaveStatus = "idle" | "saving" | "saved" | "error";

type NoteEditorPaneProps = {
	title: string;
	content: string;
	onTitleChange: (title: string) => void;
	onContentChange: (content: string) => void;
	notes: Note[];
	saveStatus: NoteSaveStatus;
	disabled?: boolean;
	className?: string;
};

export function SaveStatusIndicator({
	status,
}: {
	status: NoteSaveStatus;
}): JSX.Element | null {
	if (status === "saving") {
		return (
			<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
				<Loader2 className="h-3 w-3 animate-spin" />
				Saving...
			</span>
		);
	}
	if (status === "saved") {
		return (
			<span className="flex items-center gap-1 text-[10px] text-palm">
				<Check className="h-3 w-3" />
				Saved
			</span>
		);
	}
	if (status === "error") {
		return <span className="text-[10px] text-red-400">Failed to save</span>;
	}
	return null;
}

/**
 * Center-column pane: note title input + the markdown content editor.
 * Purely presentational/controlled — autosave debouncing and persistence
 * are owned by the parent route.
 */
export function NoteEditorPane({
	title,
	content,
	onTitleChange,
	onContentChange,
	notes,
	saveStatus,
	disabled = false,
	className,
}: NoteEditorPaneProps) {
	const noteOptions = notes.map((n) => ({ id: n.id, label: getNoteLabel(n) }));

	return (
		<div className={cn("flex flex-col gap-3 h-full min-h-0 p-4", className)}>
			<div className="flex items-center justify-between gap-3">
				<Input
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Untitled note"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<MarkdownEditor
				value={content}
				onChange={onContentChange}
				disabled={disabled}
				notes={noteOptions}
				className="flex-1 min-h-0"
				minHeight="min-h-0 flex-1"
			/>
		</div>
	);
}
