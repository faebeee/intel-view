import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreateLogEntry } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteLogEntryList } from "#/features/notes/components/NoteLogEntryList.tsx";
import { useNoteLogEntriesQuery } from "#/features/notes/hooks/useNoteLogEntriesQuery.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";

function SaveStatusIndicator({ status }: { status: NoteSaveStatus }) {
	if (status === "saving") {
		return <span className="text-[10px] text-muted-foreground">Saving...</span>;
	}
	if (status === "saved") {
		return <span className="text-[10px] text-palm">Saved</span>;
	}
	if (status === "error") {
		return <span className="text-[10px] text-red-400">Failed to save</span>;
	}
	return null;
}

type NoteLogEditorPaneProps = {
	projectId: number;
	note: Note;
	title: string;
	onTitleChange: (title: string) => void;
	saveStatus: NoteSaveStatus;
	notes: Note[];
	disabled?: boolean;
	className?: string;
};

/**
 * Center-column pane for `'log'`-type notes: the title input (same
 * autosave-driven control as `NoteEditorPane`), a compact rich-text field to
 * compose a new entry with an explicit Save button (append, not autosave),
 * and the full always-expanded list of past entries below it.
 */
export function NoteLogEditorPane({
	projectId,
	note,
	title,
	onTitleChange,
	saveStatus,
	notes,
	disabled = false,
	className,
}: NoteLogEditorPaneProps) {
	const queryClient = useQueryClient();
	const [draftEntry, setDraftEntry] = React.useState("");

	const { data: entries = [], isLoading: isEntriesLoading } =
		useNoteLogEntriesQuery(projectId, note.id);

	const createLogEntryMutation = useMutation({
		mutationFn: async (content: string) => {
			const res = await noteControllerCreateLogEntry({
				path: { projectId, id: note.id },
				body: { content },
			});
			return res.data;
		},
		onSuccess: () => {
			setDraftEntry("");
			queryClient.invalidateQueries({
				queryKey: ["notes", "log-entries", projectId, note.id],
			});
		},
		onError: toastApiError("save log entry"),
	});

	const noteOptions = notes.map((n) => ({ id: n.id, label: getNoteLabel(n) }));
	const trimmedDraft = draftEntry.trim();

	const handleSave = () => {
		if (!trimmedDraft || createLogEntryMutation.isPending) return;
		createLogEntryMutation.mutate(trimmedDraft);
	};

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
					placeholder="Untitled log"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<div className="flex flex-col gap-2 shrink-0">
				<MarkdownEditor
					value={draftEntry}
					onChange={setDraftEntry}
					placeholder="Write a new log entry..."
					disabled={disabled || createLogEntryMutation.isPending}
					notes={noteOptions}
					minHeight="min-h-24"
				/>
				<Button
					size="sm"
					className="self-end"
					onClick={handleSave}
					disabled={
						disabled || !trimmedDraft || createLogEntryMutation.isPending
					}
				>
					<Send className="h-3.5 w-3.5" />
					<span>
						{createLogEntryMutation.isPending ? "Saving..." : "Save Entry"}
					</span>
				</Button>
			</div>

			<NoteLogEntryList
				entries={entries}
				isLoading={isEntriesLoading}
				className="border-t border-line/50 pt-3"
			/>
		</div>
	);
}
