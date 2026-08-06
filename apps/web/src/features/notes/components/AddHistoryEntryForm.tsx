import { RefreshCw, Send } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import { useAddManualHistoryEntry } from "#/features/notes/hooks/useAddManualHistoryEntry.ts";

type AddHistoryEntryFormProps = {
	projectId: number;
	noteId: number;
};

/**
 * Form used to manually add a freeform history entry to a `log` note from
 * its detail view. Only rendered for `log`-type notes — other note types
 * only ever accumulate automatic 'created'/'updated' history entries.
 */
export function AddHistoryEntryForm({
	projectId,
	noteId,
}: AddHistoryEntryFormProps) {
	const [content, setContent] = React.useState("");
	const addManualEntryMutation = useAddManualHistoryEntry(projectId, noteId);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			toast.warning("Empty entry", {
				description: "History entry content cannot be empty.",
			});
			return;
		}

		addManualEntryMutation.mutate(content.trim(), {
			onSuccess: () => setContent(""),
		});
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex flex-col gap-2 p-3 rounded-lg border border-line/50 bg-[#040814]/30"
		>
			<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
				Add History Entry
			</span>
			<MarkdownEditor
				value={content}
				onChange={setContent}
				placeholder="Write a new history entry..."
				disabled={addManualEntryMutation.isPending}
				minHeight="min-h-24"
			/>
			<div className="flex justify-end">
				<Button
					type="submit"
					variant="default"
					size="xs"
					disabled={addManualEntryMutation.isPending}
				>
					{addManualEntryMutation.isPending ? (
						<>
							<RefreshCw className="h-3 w-3 animate-spin" />
							<span>Adding...</span>
						</>
					) : (
						<>
							<Send className="h-3 w-3" />
							<span>Add Entry</span>
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
