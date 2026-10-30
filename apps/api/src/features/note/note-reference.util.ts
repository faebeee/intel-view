/**
 * Matches `[[NOTE_ID]]` — the syntax used to transclude another note's
 * content into a note's own content. Kept in sync with the frontend's
 * editor-side input rule in
 * `apps/web/src/components/ui/markdown-editor/note-reference-node.ts`.
 */
export const NOTE_REFERENCE_PATTERN = /\[\[(\d+)\]\]/g;
