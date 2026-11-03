import { Check, Loader2 } from "lucide-react";
import type { JSX } from "react";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import { cn } from "#/lib/utils.ts";

export type NoteSaveStatus = "idle" | "saving" | "saved" | "error";

type NoteEditorPaneProps = {
	title: string;
	content: string;
	onTitleChange: (title: string) => void;
	onContentChange: (content: string) => void;
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
	saveStatus,
	disabled = false,
	className,
}: NoteEditorPaneProps) {
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
				className="flex-1 min-h-0"
				minHeight="min-h-0 flex-1"
			/>
		</div>
	);
}
