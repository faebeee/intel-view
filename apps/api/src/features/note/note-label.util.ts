/** A note's title/content, the minimal shape needed to derive a display label. */
export type NoteLabelSource = {
  title: string | null;
  content: string | null;
};

const MAX_LABEL_LENGTH = 60;

/**
 * Short human-readable label for a note: its title, or a truncated content
 * snippet, or a placeholder. Mirrors the frontend's `getNoteLabel` helper
 * (`apps/web/src/features/notes/hooks/useNoteTree.ts`) so labels shown via
 * the API (e.g. in `NoteLocationResponseDto`) match what the UI would
 * otherwise compute client-side.
 */
export function getNoteLabel(
  note: NoteLabelSource,
  maxLength = MAX_LABEL_LENGTH,
): string {
  const title = note.title?.trim();
  if (title) return title;

  const snippet = note.content?.trim().replace(/\s+/g, ' ');
  if (snippet) {
    return snippet.length > maxLength
      ? `${snippet.slice(0, maxLength)}…`
      : snippet;
  }

  return 'Untitled note';
}
