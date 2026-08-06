import { ChevronDown, ChevronRight, History } from "lucide-react";
import * as React from "react";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import { NoteHistoryEntries } from "./NoteHistoryEntries";

type NoteHistorySectionProps = {
	projectId: number;
	noteId: number;
};

/**
 * Collapsible "History" section shown in every note's detail view (except
 * `log`-type notes, whose main content view already displays this history
 * directly). Collapsed by default; the history query is only enabled once
 * expanded, to avoid an extra request for notes whose history nobody looks
 * at.
 */
export function NoteHistorySection({
	projectId,
	noteId,
}: NoteHistorySectionProps) {
	const [expanded, setExpanded] = React.useState(false);
	const { data: entries = [], isLoading } = useNoteHistoryQuery(
		projectId,
		noteId,
		{ enabled: expanded },
	);

	return (
		<div className="rounded-lg border border-line/50 bg-[#040814]/30 overflow-hidden">
			<button
				type="button"
				onClick={() => setExpanded((prev) => !prev)}
				className="w-full flex items-center justify-between gap-2 px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft hover:text-palm transition-colors"
			>
				<span className="flex items-center gap-1.5">
					<History className="h-3.5 w-3.5" />
					<span>History</span>
				</span>
				{expanded ? (
					<ChevronDown className="h-3.5 w-3.5" />
				) : (
					<ChevronRight className="h-3.5 w-3.5" />
				)}
			</button>
			{expanded && (
				<div className="px-3 pb-3 pt-1 border-t border-line/30">
					<NoteHistoryEntries entries={entries} isLoading={isLoading} />
				</div>
			)}
		</div>
	);
}
