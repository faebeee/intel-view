import type { Note } from './entities/note.entity';

/**
 * Matches a note reference: `[[12]]` (optionally `[[#12]]`, with
 * surrounding whitespace inside the brackets tolerated). Kept in sync with
 * the web app's `note-references.ts`.
 */
const NOTE_REFERENCE_PATTERN = /\[\[\s*#?(\d+)\s*\]\]/g;

/** Guards against pathologically deep (non-cyclic) reference chains. */
const MAX_REFERENCE_DEPTH = 10;

export type ReferenceableNote = Pick<
  Note,
  'id' | 'type' | 'title' | 'content' | 'fileName'
>;

/** Where resolved text ends up: a single-line title/value or markdown content. */
export type ReferenceTarget = 'title' | 'content';

/** Whether `text` contains at least one `[[NOTEID]]` reference. */
export function containsNoteReference(
  text: string | null | undefined,
): boolean {
  if (!text) return false;
  return new RegExp(NOTE_REFERENCE_PATTERN.source).test(text);
}

/** Whether `text` (trimmed) consists of exactly one `[[NOTEID]]` reference. */
export function isSingleNoteReference(text: string): boolean {
  return new RegExp(`^${NOTE_REFERENCE_PATTERN.source}$`).test(text.trim());
}

/** Replaces every `[[NOTEID]]` in `text` with `placeholder`. */
export function replaceNoteReferences(
  text: string,
  placeholder: string,
): string {
  return text.replace(NOTE_REFERENCE_PATTERN, placeholder);
}

/** Returns the ids of every note referenced in `text`. */
export function extractNoteReferenceIds(
  text: string | null | undefined,
): number[] {
  if (!text) return [];
  return [...text.matchAll(NOTE_REFERENCE_PATTERN)].map((m) => Number(m[1]));
}

function toSingleLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Replaces every `[[NOTEID]]` in `text` with the output of the referenced
 * note: its file name for `'file'` notes, otherwise its (recursively
 * resolved) content, falling back to its title. Unknown ids, cyclic
 * references and chains deeper than `MAX_REFERENCE_DEPTH` stay literal.
 */
export function resolveNoteReferences(
  text: string,
  notesById: ReadonlyMap<number, ReferenceableNote>,
  target: ReferenceTarget = 'content',
  visiting: ReadonlySet<number> = new Set(),
): string {
  if (!text.includes('[[')) return text;
  return text.replace(
    NOTE_REFERENCE_PATTERN,
    (match: string, rawId: string) => {
      const id = Number(rawId);
      const referenced = notesById.get(id);
      if (
        !referenced ||
        visiting.has(id) ||
        visiting.size >= MAX_REFERENCE_DEPTH
      ) {
        return match;
      }
      const nextVisiting = new Set(visiting).add(id);
      let output: string;
      if (referenced.type === 'file' && referenced.fileName) {
        output = referenced.fileName;
      } else if (referenced.content?.trim()) {
        output = resolveNoteReferences(
          referenced.content.trim(),
          notesById,
          'content',
          nextVisiting,
        );
      } else {
        output = resolveNoteReferences(
          referenced.title?.trim() ?? '',
          notesById,
          'title',
          nextVisiting,
        );
      }
      return target === 'title' ? toSingleLine(output) : output;
    },
  );
}
