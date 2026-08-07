import * as React from "react";
import { Polyline } from "react-leaflet";
import { extractNoteReferenceIds } from "#/lib/note-references.ts";
import type { MapMarkerData } from "../types";

type NoteReferenceLinesProps = {
	data: MapMarkerData[];
};

/**
 * Draws a dashed amber line between a note and any other note it links to
 * via `[[NOTE_ID]]` markdown syntax, when both are present on the map (i.e.
 * both are geolocated and currently visible). Rendered alongside
 * `NoteConnectionLines` (the parent/child hierarchy lines), but styled
 * distinctly (amber vs. cyan `--lagoon`) so the two relationship types
 * can't be confused.
 */
export function NoteReferenceLines({ data }: NoteReferenceLinesProps) {
	const byId = React.useMemo(() => {
		const map = new Map<string, MapMarkerData>();
		for (const marker of data) {
			map.set(marker.id, marker);
		}
		return map;
	}, [data]);

	const connections = React.useMemo(() => {
		const result: { key: string; from: MapMarkerData; to: MapMarkerData }[] = [];
		const seen = new Set<string>();
		for (const marker of data) {
			for (const refId of extractNoteReferenceIds(marker.content)) {
				if (String(refId) === marker.id) continue;
				const target = byId.get(String(refId));
				if (!target) continue;
				// A pair of notes may reference each other, or the same note
				// twice; only draw one line per unordered pair.
				const pairKey = [marker.id, target.id].sort().join("-");
				if (seen.has(pairKey)) continue;
				seen.add(pairKey);
				result.push({
					key: `note-reference-${marker.id}-${target.id}`,
					from: marker,
					to: target,
				});
			}
		}
		return result;
	}, [data, byId]);

	return (
		<>
			{connections.map(({ key, from, to }) => (
				<Polyline
					key={key}
					positions={[
						[from.lat, from.lng],
						[to.lat, to.lng],
					]}
					pathOptions={{
						color: "var(--reference-link)",
						weight: 2,
						opacity: 0.6,
						dashArray: "2 8",
					}}
				/>
			))}
		</>
	);
}
export default NoteReferenceLines;
