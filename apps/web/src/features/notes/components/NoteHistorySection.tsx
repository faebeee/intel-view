import type { NoteHistoryEntryResponseDto as NoteHistoryEntry } from "@repo/sdk";
import {
	ChevronRight,
	History as HistoryIcon,
	Link as LinkIcon,
	Pencil,
	Plus,
	Unlink,
} from "lucide-react";
import * as React from "react";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { formatIsoDateTime } from "#/lib/format.ts";
import { cn } from "#/lib/utils.ts";

type NoteHistorySectionProps = {
	entries: NoteHistoryEntry[];
	isLoading?: boolean;
	className?: string;
};

/**
 * Shape of each entry in `NoteHistoryEntryResponseDto.changes` as actually
 * returned by the backend (`NoteFieldChange`). The SDK types this loosely
 * as `Record<string, unknown>` since Swagger only declares it as `[Object]`.
 */
type FieldChange = {
	field: string;
	previousValue: unknown;
	newValue: unknown;
};

function getFieldChanges(entry: NoteHistoryEntry): FieldChange[] {
	return (entry.changes as FieldChange[] | null | undefined) ?? [];
}

/** Human-readable label for a tracked field name (matches `HISTORY_TRACKED_FIELDS` on the backend). */
const FIELD_LABELS: Record<string, string> = {
	title: "Title",
	content: "Content",
	tags: "Tags",
};

function formatFieldValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "Empty";
	}
	if (Array.isArray(value)) {
		return value.length > 0 ? value.join(", ") : "None";
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed === "") return "Empty";
		return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
	}
	return String(value);
}

function ChangeTypeIcon({ changeType }: { changeType: string }) {
	if (changeType === "created") {
		return <Plus className="h-3 w-3 text-emerald-400" />;
	}
	if (changeType === "link_added") {
		return <LinkIcon className="h-3 w-3 text-emerald-400" />;
	}
	if (changeType === "link_removed") {
		return <Unlink className="h-3 w-3 text-red-400" />;
	}
	return <Pencil className="h-3 w-3 text-palm" />;
}

function changeTypeLabel(changeType: string): string {
	switch (changeType) {
		case "created":
			return "Created";
		case "link_added":
			return "Link added";
		case "link_removed":
			return "Link removed";
		default:
			return "Updated";
	}
}

function LinkChangeDescription({ entry }: { entry: NoteHistoryEntry }) {
	if (entry.relatedNoteId === null || entry.relatedNoteId === undefined) {
		return null;
	}
	const verb = entry.changeType === "link_added" ? "Added" : "Removed";
	const role = entry.direction === "parent" ? "parent" : "child";
	return (
		<p className="text-[10px] leading-snug text-muted-foreground">
			{verb} note{" "}
			<span className="font-mono text-palm">#{entry.relatedNoteId}</span> as{" "}
			{role}
		</p>
	);
}

function HistoryEntryRow({ entry }: { entry: NoteHistoryEntry }) {
	const changes = getFieldChanges(entry);

	return (
		<div className="flex flex-col gap-1.5 border-l-2 border-line/60 pl-2.5 py-0.5">
			<div className="flex items-center gap-1.5">
				<ChangeTypeIcon changeType={entry.changeType} />
				<span className="text-[10px] font-bold uppercase tracking-wider text-sea-ink-soft">
					{changeTypeLabel(entry.changeType)}
				</span>
				<span className="text-[9px] font-mono text-muted-foreground ml-auto whitespace-nowrap">
					{formatIsoDateTime(entry.createdAt)}
				</span>
			</div>

			<LinkChangeDescription entry={entry} />

			{changes.length > 0 && (
				<ul className="flex flex-col gap-1">
					{changes.map((change) => (
						<li key={change.field} className="text-[10px] leading-snug">
							<span className="font-bold text-sea-ink-soft">
								{FIELD_LABELS[change.field] ?? change.field}:
							</span>{" "}
							<span className="text-muted-foreground line-through decoration-red-400/50">
								{formatFieldValue(change.previousValue)}
							</span>{" "}
							<span className="text-muted-foreground">→</span>{" "}
							<span className="text-palm">
								{formatFieldValue(change.newValue)}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

/**
 * Plain, always-visible list of history entries (most recent first). Used
 * directly by the canvas inspector's HISTORY tab, and inside the
 * collapsible `NoteHistorySection` elsewhere.
 */
export function NoteHistoryList({
	entries,
	isLoading = false,
	className,
}: NoteHistorySectionProps) {
	return (
		<div className={cn("flex flex-col gap-2.5", className)}>
			{isLoading ? (
				<p className="text-[10px] text-muted-foreground">Loading history...</p>
			) : entries.length === 0 ? (
				<p className="text-[10px] text-muted-foreground">No history yet.</p>
			) : (
				entries.map((entry) => <HistoryEntryRow key={entry.id} entry={entry} />)
			)}
		</div>
	);
}

/**
 * Collapsible "History" section shown in the note settings panel, listing
 * every automatic change entry (creation + tracked field edits) recorded
 * for the note, most recent first.
 */
export function NoteHistorySection({
	entries,
	isLoading = false,
	className,
}: NoteHistorySectionProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Collapsible open={open} onOpenChange={setOpen} className={className}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 w-full text-left"
				>
					<ChevronRight
						className={cn(
							"h-3 w-3 shrink-0 text-muted-foreground transition-transform",
							open && "rotate-90",
						)}
					/>
					<HistoryIcon className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft">
						History
					</span>
					{entries.length > 0 && (
						<span className="text-[9px] text-muted-foreground font-mono ml-1">
							({entries.length})
						</span>
					)}
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent>
				<NoteHistoryList
					entries={entries}
					isLoading={isLoading}
					className="pt-3 pl-1"
				/>
			</CollapsibleContent>
		</Collapsible>
	);
}
