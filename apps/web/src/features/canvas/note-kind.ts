import type { NoteType } from "#/types/note.ts";
import type { Note } from "./types";

type NoteKind = {
	/** Caps label printed on nodes and in the inspector. */
	label: string;
	/** Design token (CSS variable) for the label colour. */
	color: string;
};

/**
 * Kind labels for the existing note types. The design's pentest kinds
 * (HOST / SCAN / SERVICE / CREDS / EXPLOIT / FLAG) need a new data field
 * (handoff §04) and aren't implemented; nodes print the current type
 * instead, so a kind is never conveyed by colour alone.
 */
export const NOTE_KINDS: Record<NoteType, NoteKind> = {
	standard: { label: "NOTE", color: "var(--mc-text-soft)" },
	log: { label: "LOG", color: "var(--mc-data)" },
	file: { label: "FILE", color: "var(--mc-warning)" },
	url: { label: "URL", color: "var(--mc-service)" },
	ip: { label: "IP", color: "var(--mc-text)" },
};

export function noteKind(note: Pick<Note, "type">): NoteKind {
	return NOTE_KINDS[note.type] ?? NOTE_KINDS.standard;
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
