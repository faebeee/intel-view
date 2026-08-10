/**
 * A single geographic pin as parsed out of a note's markdown `content`.
 */
export type ParsedNoteLocation = {
  lat: number;
  lng: number;
  label: string | null;
};

/**
 * Matches `[[geo:LAT,LNG,LABEL]]` — the syntax used to embed a map location
 * reference inline in note markdown content. `LABEL` is optional and may be
 * empty (e.g. `[[geo:1.23,4.56,]]`). Kept in sync with the editor-side regex
 * in `#/components/ui/markdown-editor/note-location-node.ts` and the
 * read-only renderer in `#/components/ui/markdown/note-location-extension.ts`.
 */
const NOTE_LOCATION_PATTERN =
  /\[\[geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),([^\]]*)\]\]/g;

/**
 * Extracts every `[[geo:LAT,LNG,LABEL]]` token from a note's markdown
 * content, returning the parsed locations in the order they appear. Used to
 * keep the `NoteLocation` table in sync with the note's content whenever it
 * is created or updated.
 */
export function parseNoteLocations(
  content: string | null | undefined,
): ParsedNoteLocation[] {
  if (!content) {
    return [];
  }

  const results: ParsedNoteLocation[] = [];
  NOTE_LOCATION_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = NOTE_LOCATION_PATTERN.exec(content);
  while (match !== null) {
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    const label = match[3].trim().length > 0 ? match[3].trim() : null;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      results.push({ lat, lng, label });
    }
    match = NOTE_LOCATION_PATTERN.exec(content);
  }
  return results;
}
