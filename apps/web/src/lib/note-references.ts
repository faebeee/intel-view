/**
 * Matches `[[NOTE_ID]]` — the syntax used throughout the app to reference
 * another note from markdown content. Kept in sync with the editor-side
 * regexes in `#/components/ui/markdown-editor/note-reference-node.ts`.
 */
export const NOTE_REFERENCE_PATTERN = /\[\[(\d+)\]\]/g;

/**
 * Extracts every unique note id referenced via `[[NOTE_ID]]` syntax in a
 * note's markdown content. Used to draw "reference" connections between
 * notes on the canvas and map views, in addition to the explicit
 * parent/child relationship.
 */
export function extractNoteReferenceIds(content: string | null | undefined): number[] {
	if (!content) return [];
	const ids = new Set<number>();
	for (const match of content.matchAll(NOTE_REFERENCE_PATTERN)) {
		ids.add(Number(match[1]));
	}
	return [...ids];
}
