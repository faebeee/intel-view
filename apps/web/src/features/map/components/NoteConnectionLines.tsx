import * as React from "react";
import { Polyline } from "react-leaflet";
import type { MapMarkerData } from "../types";

type NoteConnectionLinesProps = {
	data: MapMarkerData[];
};

/**
 * Draws a dashed line between each note marker and its parent note marker,
 * when both are present on the map (i.e. both are geolocated and currently
 * visible), making the nesting hierarchy visible on the map.
 */
export function NoteConnectionLines({ data }: NoteConnectionLinesProps) {
	const byId = React.useMemo(() => {
		const map = new Map<string, MapMarkerData>();
		for (const marker of data) {
			map.set(marker.id, marker);
		}
		return map;
	}, [data]);

	const connections = React.useMemo(() => {
		const result: { key: string; parent: MapMarkerData; child: MapMarkerData }[] = [];
		for (const marker of data) {
			if (marker.parentId === null || marker.parentId === undefined) continue;
			const parent = byId.get(String(marker.parentId));
			if (!parent) continue;
			result.push({ key: `note-link-${parent.id}-${marker.id}`, parent, child: marker });
		}
		return result;
	}, [data, byId]);

	return (
		<>
			{connections.map(({ key, parent, child }) => (
				<Polyline
					key={key}
					positions={[
						[parent.lat, parent.lng],
						[child.lat, child.lng],
					]}
					pathOptions={{
						color: "var(--lagoon)",
						weight: 2,
						opacity: 0.55,
						dashArray: "6 6",
					}}
				/>
			))}
		</>
	);
}
export default NoteConnectionLines;
