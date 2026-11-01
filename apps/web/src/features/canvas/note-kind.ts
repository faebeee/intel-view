import { SOFTWARE_TYPE_SUGGESTIONS } from "#/types/note.ts";
import type { Note } from "./types";

type NoteKind = {
	/** Caps label printed on nodes and in the inspector. */
	label: string;
	/** Design token (CSS variable) for the label colour. */
	color: string;
};

/**
 * Kind labels for the built-in note types plus the known software/service
 * suggestions (`SOFTWARE_TYPE_SUGGESTIONS`). `NoteType` is open-ended (any
 * lowercase slug can be a custom service type), so this can't be an
 * exhaustive `Record` — `noteKind()` falls back to a generated kind (the
 * type itself, uppercased) for anything not listed here. The design's
 * pentest kinds (HOST / SCAN / CREDS / EXPLOIT / FLAG) need further data
 * fields (handoff §04) and aren't implemented.
 */
export const NOTE_KINDS: Record<string, NoteKind> = {
	standard: { label: "NOTE", color: "var(--mc-text-soft)" },
	log: { label: "LOG", color: "var(--mc-data)" },
	file: { label: "FILE", color: "var(--mc-warning)" },
	url: { label: "URL", color: "var(--mc-service)" },
	ip: { label: "IP", color: "var(--mc-text)" },
	...Object.fromEntries(
		SOFTWARE_TYPE_SUGGESTIONS.map((type) => [
			type,
			{ label: type.toUpperCase(), color: "var(--mc-service)" },
		]),
	),
};

export function noteKind(note: Pick<Note, "type">): NoteKind {
	return (
		NOTE_KINDS[note.type] ?? {
			label: note.type.toUpperCase(),
			color: "var(--mc-service)",
		}
	);
}

/** Friendly label for a note's type, shown in settings/details panels (not the all-caps canvas badge). */
export function noteTypeLabel(type: Note["type"]): string {
	switch (type) {
		case "standard":
			return "Standard";
		case "log":
			return "Log";
		case "file":
			return "File";
		case "url":
			return "Link";
		case "ip":
			return "IP Address";
		default:
			return type.toUpperCase();
	}
}

/** One-line summary shown under the node title. */
export function noteSubtitle(
	note: Pick<Note, "type" | "content" | "fileName" | "childIds">,
): string {
	if (note.type === "file") return note.fileName ?? "no file";
	const content = (note.content || "")
		.replace(/```\w*/g, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (content) return content;
	const children = note.childIds?.length ?? 0;
	return children > 0
		? `${children} linked ${children === 1 ? "note" : "notes"}`
		: "empty";
}
