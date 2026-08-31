import type { NoteResponseDto as Note } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import { ExternalLink, StickyNote, Trash2, X } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Markdown } from "#/components/ui/markdown.tsx";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { NoteHistorySection } from "#/features/notes/components/NoteHistorySection.tsx";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import { useNoteLogEntriesQuery } from "#/features/notes/hooks/useNoteLogEntriesQuery.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { cn } from "#/lib/utils.ts";

export type NoteDetailsPanelProps = {
	projectId: number;
	/** String form of `projectId` as used in the route params, for the "Open note" link. */
	projectIdParam: string;
	note: Note;
	notes: Note[];
	/** When provided, renders a close (X) button in the header — used by views (e.g. canvas) with no other way to deselect the note. */
	onClose?: () => void;
	/** Called after the note is successfully deleted, so the caller can clear its selection. */
	onDeleted?: () => void;
	className?: string;
};

/**
 * Read-only note details panel, shown whenever a note is focused/selected
 * (e.g. in the map or canvas views). Mirrors the fields of
 * `NoteSettingsPanel` (parent, tags, rendered content, timestamps, history)
 * for display, plus a delete action — editing otherwise happens on the
 * note's own detail/editor page, linked to via the "Open note" button.
 */
export function NoteDetailsPanel({
	projectId,
	projectIdParam,
	note,
	notes,
	onClose,
	onDeleted,
	className,
}: NoteDetailsPanelProps) {
	const parents = React.useMemo(
		() =>
			(note.parentIds ?? [])
				.map((id) => notes.find((n) => n.id === id))
				.filter((n): n is Note => n !== undefined),
		[notes, note.parentIds],
	);
	const { data: tags = [] } = useAllTagsQuery();
	const tagColorMap = useTagColorMap(tags);
	const { data: historyEntries = [], isLoading: isHistoryLoading } =
		useNoteHistoryQuery(projectId, note.id);
	const { data: logEntries = [] } = useNoteLogEntriesQuery(
		projectId,
		note.type === "log" ? note.id : undefined,
	);
	const latestLogEntry = logEntries[0] ?? null;
	const deleteNoteMutation = useDeleteNote(projectId);

	const handleDelete = React.useCallback(() => {
		deleteNoteMutation.mutate(note.id, { onSuccess: onDeleted });
	}, [deleteNoteMutation, note.id, onDeleted]);

	return (
		<div className={cn("flex flex-col min-h-0", className)}>
			<div className="flex-1 min-h-0 overflow-y-auto">
				<div className="flex flex-col gap-5 p-3">
					<div className="flex flex-col gap-1 px-1">
						<div className="flex items-center justify-between gap-2">
							<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft">
								Note Details
							</span>
							{onClose && (
								<Button
									variant="ghost"
									size="icon-xs"
									onClick={onClose}
									title="Close"
								>
									<X className="h-3.5 w-3.5" />
								</Button>
							)}
						</div>
						<div className="flex items-center gap-1.5">
							<StickyNote className="h-4 w-4 text-palm shrink-0" />
							<h2 className="text-sm font-bold text-sea-ink truncate">
								{getNoteLabel(note)}
							</h2>
						</div>
					</div>

					<div className="flex flex-col gap-1 px-1">
						<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
							Parent Notes
						</span>
						<span className="text-xs text-sea-ink-soft truncate">
							{parents.length > 0
								? parents.map((p) => getNoteLabel(p)).join(", ")
								: "None (root note)"}
						</span>
					</div>

					<div className="flex flex-col gap-1.5 px-1">
						<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
							Tags
						</span>
						{note.tags && note.tags.length > 0 ? (
							<TagChipList tags={note.tags} tagColorMap={tagColorMap} />
						) : (
							<span className="text-xs text-muted-foreground">No tags</span>
						)}
					</div>

					<div className="flex flex-col gap-1.5 px-1">
						<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
							{note.type === "log" ? "Latest Log Entry" : "Content"}
						</span>
						{note.type === "log" ? (
							latestLogEntry ? (
								<div className="flex flex-col gap-1">
									<span className="text-[9px] text-muted-foreground font-mono">
										{new Date(latestLogEntry.createdAt).toLocaleString()}
									</span>
									<Markdown
										content={latestLogEntry.content}
										className="text-xs"
									/>
								</div>
							) : (
								<span className="text-xs text-muted-foreground">
									No log entries yet
								</span>
							)
						) : note.content?.trim() ? (
							<Markdown content={note.content} className="text-xs" />
						) : (
							<span className="text-xs text-muted-foreground">No content</span>
						)}
					</div>

					<div className="flex flex-col gap-1 px-1 pt-2 border-t border-line/50">
						<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
							Created
						</span>
						<span className="text-xs font-mono text-sea-ink-soft">
							{new Date(note.createdAt).toLocaleString()}
						</span>
					</div>
					<div className="flex flex-col gap-1 px-1">
						<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
							Updated
						</span>
						<span className="text-xs font-mono text-sea-ink-soft">
							{new Date(note.updatedAt).toLocaleString()}
						</span>
					</div>

					<NoteHistorySection
						entries={historyEntries}
						isLoading={isHistoryLoading}
						className="px-1 pt-2 border-t border-line/50"
					/>
				</div>
			</div>

			<div className="flex items-center gap-2 p-3 border-t border-line shrink-0">
				<Button asChild size="sm" className="flex-1">
					<Link
						to="/projects/$projectId/notes"
						params={{ projectId: projectIdParam }}
						search={{ noteId: note.id }}
						className="text-primary-foreground!"
					>
						<ExternalLink className="h-3.5 w-3.5" />
						<span>Open note</span>
					</Link>
				</Button>
				<ConfirmationButton
					variant="outline"
					size="sm"
					className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
					title="Delete Note"
					description="Are you sure you want to permanently delete this note? Any notes linked to it as children will remain (losing this parent connection)."
					confirmText="Delete"
					disabled={deleteNoteMutation.isPending}
					onClick={handleDelete}
				>
					<Trash2 className="h-3.5 w-3.5" />
				</ConfirmationButton>
			</div>
		</div>
	);
}
