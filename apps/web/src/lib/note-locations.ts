/**
 * Matches `[[geo:LAT,LNG,LABEL]]` — the syntax used to embed a map location
 * reference inline in a note's markdown content. `LABEL` is optional and may
 * be empty (e.g. `[[geo:1.23,4.56,]]`). Kept in sync with the editor-side
 * node in `#/components/ui/markdown-editor/note-location-node.ts`, the
 * read-only renderer in `#/components/ui/markdown/note-location-extension.ts`,
 * and the API-side parser in `apps/api/src/features/note/note-location.util.ts`.
 */
export const NOTE_LOCATION_PATTERN = /\[\[geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),([^\]]*)\]\]/g;

export type NoteLocationToken = {
	lat: number;
	lng: number;
	label: string | null;
};

/**
 * Extracts every `[[geo:LAT,LNG,LABEL]]` token from a note's markdown
 * content. Used to draw locations on map views in addition to whatever the
 * inline editor/renderer show.
 */
export function extractNoteLocations(content: string | null | undefined): NoteLocationToken[] {
	if (!content) return [];
	const results: NoteLocationToken[] = [];
	for (const match of content.matchAll(NOTE_LOCATION_PATTERN)) {
		const lat = Number(match[1]);
		const lng = Number(match[2]);
		const label = match[3].trim().length > 0 ? match[3].trim() : null;
		if (Number.isFinite(lat) && Number.isFinite(lng)) {
			results.push({ lat, lng, label });
		}
	}
	return results;
}

/** Serializes a location back into its `[[geo:LAT,LNG,LABEL]]` markdown token. */
export function serializeNoteLocation(location: NoteLocationToken): string {
	return `[[geo:${location.lat},${location.lng},${location.label ?? ""}]]`;
}
