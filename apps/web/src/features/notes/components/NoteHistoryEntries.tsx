import type { NoteHistoryEntryResponseDto } from "@repo/sdk";
import { History, PlusCircle } from "lucide-react";

/** Shape of a single field-level diff within an 'updated' history entry. */
type NoteFieldChange = {
	field: string;
	previousValue: unknown;
	newValue: unknown;
};

type NoteHistoryEntriesProps = {
	entries: NoteHistoryEntryResponseDto[];
	isLoading?: boolean;
	/** Shown when there are no entries yet (and not loading). */
	emptyMessage?: string;
};

const FIELD_LABELS: Record<string, string> = {
	content: "Content",
	tags: "Tags",
	parentId: "Parent note",
};

function formatFieldLabel(field: string): string {
	return FIELD_LABELS[field] ?? field;
}

function formatFieldValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "(empty)";
	}
	if (Array.isArray(value)) {
		return value.length > 0 ? value.join(", ") : "(empty)";
	}
	if (typeof value === "object") {
		return JSON.stringify(value);
	}
	const stringValue = String(value);
	return stringValue.length > 120
		? `${stringValue.slice(0, 120)}…`
		: stringValue;
}

function formatTimestamp(value: string): string {
	return new Date(value).toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Renders a note's automatic change history as a reverse-chronological
 * timeline: a 'created' marker for when the note was made, and one card per
 * subsequent edit listing every field that changed (previous → new value).
 * Shared between the `log` note type's primary content view and the
 * collapsible "History" section shown for every other note type.
 */
export function NoteHistoryEntries({
	entries,
	isLoading,
	emptyMessage = "No history recorded yet.",
}: NoteHistoryEntriesProps) {
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-6 text-xs text-muted-foreground font-mono animate-pulse">
				Loading history...
			</div>
		);
	}

	if (entries.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
				<History className="h-6 w-6 opacity-40" />
				<p className="text-xs italic">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{entries.map((entry) => (
				<div
					key={entry.id}
					className="flex flex-col gap-1.5 pb-3 border-b border-line/30 last:border-b-0 last:pb-0"
				>
					<div className="flex items-center gap-1.5">
						{entry.changeType === "created" ? (
							<PlusCircle className="h-3 w-3 text-palm" />
						) : (
							<History className="h-3 w-3 text-palm" />
						)}
						<span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
							{formatTimestamp(entry.createdAt)}
						</span>
						<span className="text-[10px] font-mono font-bold uppercase tracking-wider text-palm">
							{entry.changeType === "created" ? "Note created" : "Updated"}
						</span>
					</div>
					{entry.changeType === "updated" && entry.changes && (
						<ul className="flex flex-col gap-1 pl-4">
							{(entry.changes as unknown as NoteFieldChange[]).map((change) => (
								<li
									key={`${entry.id}-${change.field}`}
									className="text-xs font-sans"
								>
									<span className="font-bold text-sea-ink-soft">
										{formatFieldLabel(change.field)}:
									</span>{" "}
									<span className="text-muted-foreground line-through">
										{formatFieldValue(change.previousValue)}
									</span>{" "}
									<span className="text-muted-foreground">→</span>{" "}
									<span className="text-foreground">
										{formatFieldValue(change.newValue)}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			))}
		</div>
	);
}
