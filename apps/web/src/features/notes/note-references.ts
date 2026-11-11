import type { NoteResponseDto as Note } from "@repo/sdk";
import * as React from "react";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";

/**
 * Matches a note reference: `[[12]]` (optionally `[[#12]]`, with
 * surrounding whitespace inside the brackets tolerated).
 */
const NOTE_REFERENCE_PATTERN = /\[\[\s*#?(\d+)\s*\]\]/g;

/** Guards against pathologically deep (non-cyclic) reference chains. */
const MAX_REFERENCE_DEPTH = 10;

type ReferenceableNote = Pick<
	Note,
	"id" | "type" | "title" | "content" | "fileName"
>;

/** Where the resolved text ends up: a single-line title or markdown content. */
type ReferenceTarget = "title" | "content";

/** Collapses all whitespace (incl. newlines) so referenced output fits on one line. */
function toSingleLine(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

/**
 * Replaces every `[[NOTEID]]` in `text` with the rendered output of the
 * referenced note (see `renderNoteOutput`). References are resolved
 * recursively, so a referenced note may itself reference other notes.
 * Unknown ids, self/cyclic references and chains deeper than
 * `MAX_REFERENCE_DEPTH` are left untouched as literal `[[NOTEID]]` text.
 */
export function resolveNoteReferences(
	text: string,
	notesById: ReadonlyMap<number, ReferenceableNote>,
	target: ReferenceTarget = "content",
	visiting: ReadonlySet<number> = new Set(),
): string {
	if (!text.includes("[[")) return text;
	return text.replace(NOTE_REFERENCE_PATTERN, (match, rawId: string) => {
		const id = Number(rawId);
		const referenced = notesById.get(id);
		if (
			!referenced ||
			visiting.has(id) ||
			visiting.size >= MAX_REFERENCE_DEPTH
		) {
			return match;
		}
		const output = renderNoteOutput(
			referenced,
			notesById,
			new Set(visiting).add(id),
		);
		return target === "title" ? toSingleLine(output) : output;
	});
}

/**
 * The "output" a note contributes when referenced elsewhere: its file name
 * for `'file'` notes, otherwise its (resolved) content, falling back to its
 * (resolved) title when the content is empty (e.g. `'log'` notes, whose own
 * `content` is unused).
 */
function renderNoteOutput(
	note: ReferenceableNote,
	notesById: ReadonlyMap<number, ReferenceableNote>,
	visiting: ReadonlySet<number>,
): string {
	if (note.type === "file" && note.fileName) return note.fileName;
	const content = note.content?.trim();
	if (content) {
		return resolveNoteReferences(content, notesById, "content", visiting);
	}
	return resolveNoteReferences(
		note.title?.trim() ?? "",
		notesById,
		"title",
		visiting,
	);
}

/**
 * Returns display copies of `notes` with every `[[NOTEID]]` reference in
 * their `title` and `content` replaced by the referenced note's output.
 * Only for read-only display: editors must keep working with the original
 * notes so the raw title/markup (including the references) stays editable.
 * Notes without any reference are returned as-is (same object identity).
 */
export function renderNotes<T extends ReferenceableNote>(notes: T[]): T[] {
	const notesById = new Map<number, ReferenceableNote>(
		notes.map((note) => [note.id, note]),
	);
	return notes.map((note) => {
		const title = note.title
			? resolveNoteReferences(
					note.title,
					notesById,
					"title",
					new Set([note.id]),
				)
			: note.title;
		const content = note.content
			? resolveNoteReferences(
					note.content,
					notesById,
					"content",
					new Set([note.id]),
				)
			: note.content;
		return title === note.title && content === note.content
			? note
			: { ...note, title, content };
	});
}

/** Memoized `renderNotes` for use in components. */
export function useRenderedNotes<T extends ReferenceableNote>(notes: T[]): T[] {
	return React.useMemo(() => renderNotes(notes), [notes]);
}

/**
 * Prepares typed-note content (url/ip) for client-side format validation,
 * mirroring the API: a value that is exactly one `[[NOTEID]]` reference
 * returns `""` (nothing to validate until resolved), otherwise every
 * reference is swapped for `placeholder` (a fragment valid for the format)
 * so the surrounding text is still validated.
 */
export function contentForValidation(
	value: string,
	placeholder: string,
): string {
	const trimmed = value.trim();
	if (new RegExp(`^${NOTE_REFERENCE_PATTERN.source}$`).test(trimmed)) return "";
	return trimmed.replace(NOTE_REFERENCE_PATTERN, placeholder);
}

/**
 * Returns `text` with `[[NOTEID]]` references resolved against the
 * project's notes (from the cached `useAllNotesQuery`), excluding a
 * reference to `selfId`. For display next to an editor that keeps the raw
 * value, e.g. the saved-value preview of url/ip notes.
 */
export function useResolvedNoteText(
	projectId: number,
	selfId: number,
	text: string,
	target: ReferenceTarget = "content",
): string {
	const { data: notes } = useAllNotesQuery(projectId);
	return React.useMemo(() => {
		if (!notes || !text.includes("[[")) return text;
		const notesById = new Map<number, ReferenceableNote>(
			notes.map((note) => [note.id, note]),
		);
		return resolveNoteReferences(text, notesById, target, new Set([selfId]));
	}, [notes, text, target, selfId]);
}
