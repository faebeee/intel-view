import type { NoteLogEntryResponseDto as NoteLogEntry } from "@repo/sdk";
import { ScrollText } from "lucide-react";
import { Markdown } from "#/components/ui/markdown.tsx";
import { cn } from "#/lib/utils.ts";

type NoteLogEntryListProps = {
	entries: NoteLogEntry[];
	isLoading?: boolean;
	className?: string;
};

function LogEntryRow({ entry }: { entry: NoteLogEntry }) {
	return (
		<div className="flex flex-col gap-1.5 border-l-2 border-line/60 pl-3 py-1">
			<span className="text-[9px] text-muted-foreground uppercase tracking-wider whitespace-nowrap">
				{new Date(entry.createdAt).toLocaleString()}
			</span>
			<Markdown content={entry.content} className="text-xs" />
		</div>
	);
}

/**
 * Always-expanded, most-recent-first list of a log note's entries, shown
 * below `NoteLogEditorPane`'s compact editor. Unlike `NoteHistorySection`
 * (an auxiliary, collapsed-by-default audit trail), this list *is* the
 * primary content of a log note, so it's never collapsed.
 */
export function NoteLogEntryList({
	entries,
	isLoading = false,
	className,
}: NoteLogEntryListProps) {
	return (
		<div className={cn("flex flex-col gap-3", className)}>
			<div className="flex items-center gap-1.5 px-1">
				<ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
				<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft">
					Log Entries
				</span>
				{entries.length > 0 && (
					<span className="text-[9px] text-muted-foreground font-mono">
						({entries.length})
					</span>
				)}
			</div>

			{isLoading ? (
				<p className="text-xs text-muted-foreground px-1">
					Loading log entries...
				</p>
			) : entries.length === 0 ? (
				<p className="text-xs text-muted-foreground px-1">
					No log entries yet. Write something above and save it.
				</p>
			) : (
				<div className="flex flex-col gap-3 px-1">
					{entries.map((entry) => (
						<LogEntryRow key={entry.id} entry={entry} />
					))}
				</div>
			)}
		</div>
	);
}
