import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import {
	FormField,
	TERMINAL_INPUT_CLASS,
} from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { NoteContentFields } from "#/features/notes/components/NoteContentFields.tsx";
import { invalidateNoteQueries } from "#/features/notes/utils/invalidateNoteQueries.ts";
import { toastApiError } from "#/lib/api-error.ts";

const ROOT_PARENT_VALUE = "root";

type CreateNoteModalProps = {
	projectId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Notes available in the project, used to populate the parent selector. */
	notes?: Note[];
	/** Pre-selects a parent note (e.g. when adding a sub-note from the tree view). */
	defaultParentId?: number | null;
	onSuccess?: () => void;
};

export function CreateNoteModal({
	projectId,
	open,
	onOpenChange,
	notes = [],
	defaultParentId = null,
	onSuccess,
}: CreateNoteModalProps) {
	const [content, setContent] = React.useState("");
	const [tagsInput, setTagsInput] = React.useState("");
	const [parentId, setParentId] = React.useState<string>(ROOT_PARENT_VALUE);
	const queryClient = useQueryClient();

	// Reset form when modal closes or opens, pre-filling the parent if provided
	React.useEffect(() => {
		if (!open) {
			setContent("");
			setTagsInput("");
			setParentId(ROOT_PARENT_VALUE);
		} else {
			setParentId(
				defaultParentId !== null && defaultParentId !== undefined
					? String(defaultParentId)
					: ROOT_PARENT_VALUE,
			);
		}
	}, [open, defaultParentId]);

	const createNoteMutation = useMutation({
		mutationFn: async (payload: {
			content: string;
			tags: string[];
			parentId: number | null;
		}) => {
			const res = await noteControllerCreate({
				path: { projectId },
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note added successfully");
			invalidateNoteQueries(queryClient, projectId);
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: toastApiError("add note"),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			toast.warning("Empty content", {
				description: "Note content cannot be empty.",
			});
			return;
		}

		const tagsArray = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		createNoteMutation.mutate({
			content: content.trim(),
			tags: tagsArray,
			parentId: parentId === ROOT_PARENT_VALUE ? null : parseInt(parentId, 10),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md md:max-w-3xl lg:max-w-4xl shadow-2xl shadow-black/80 duration-200 transition-all">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Add Note
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Create a new note with markdown preview and tags.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-5 my-2">
					{/* Parent Note Selector */}
					<FormField label="Parent Note (Optional)" htmlFor="note-parent">
						<Select
							value={parentId}
							onValueChange={setParentId}
							disabled={createNoteMutation.isPending}
						>
							<SelectTrigger id="note-parent" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ROOT_PARENT_VALUE}>
									No parent (root note)
								</SelectItem>
								{notes.map((n) => (
									<SelectItem key={n.id} value={String(n.id)}>
										#{n.id} — {(n.content || "").slice(0, 40) || "No content"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</FormField>

					{/* Markdown content field */}
					<NoteContentFields
						projectId={projectId}
						content={content}
						onContentChange={setContent}
						disabled={createNoteMutation.isPending}
						markdownMinHeight="min-h-36"
					/>

					{/* Tags Input */}
					<FormField label="Tags (separated by commas)" htmlFor="note-tags">
						<Input
							id="note-tags"
							type="text"
							placeholder="e.g. location, family"
							className={TERMINAL_INPUT_CLASS}
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							disabled={createNoteMutation.isPending}
						/>
					</FormField>

					<DialogFooter className="pt-2 border-t border-line/30">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={createNoteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={createNoteMutation.isPending}
						>
							{createNoteMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Adding...
								</>
							) : (
								"Add Note"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
