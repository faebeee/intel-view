import type { NoteLocationResponseDto } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { MapPin } from "lucide-react";
import * as React from "react";
import { Polyline, Popup, useMap } from "react-leaflet";
import { Button } from "#/components/ui/button.tsx";
import {
	DEFAULT_MAP_CENTER,
	DEFAULT_MAP_ZOOM,
	LeafletMap,
	LeafletMarker,
} from "#/features/map/components/LeafletMap.tsx";
import {
	DEFAULT_MARKER_COLOR,
	getTagMarkerIcon,
} from "#/features/map/lib/tag-marker-icon.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";

/** Imperatively fits the map's viewport to contain every given point, once, when the set of points first becomes available. */
function FitBoundsToMarkers({
	positions,
}: {
	positions: Array<[number, number]>;
}) {
	const map = useMap();
	const fittedRef = React.useRef(false);

	React.useEffect(() => {
		if (fittedRef.current || positions.length === 0) return;
		fittedRef.current = true;
		if (positions.length === 1) {
			map.setView(positions[0], 13);
			return;
		}
		map.fitBounds(L.latLngBounds(positions), { padding: [32, 32] });
	}, [map, positions]);

	return null;
}

export type AllLocationsMapProps = {
	projectId: string;
	locations: NoteLocationResponseDto[];
	className?: string;
};

/**
 * Read-only map plotting every location pin derived from every note in a
 * project. Clicking a marker opens a popup with the owning note's label and
 * a link to open that note in the Notes editor. Reusable wherever a
 * project-wide "all note locations" overview is needed (currently the
 * `/projects/$projectId/map` route).
 */
export function AllLocationsMap({
	projectId,
	locations,
	className,
}: AllLocationsMapProps) {
	const { data: tags = [] } = useAllTagsQuery(parseInt(projectId, 10));
	const tagColorMap = useTagColorMap(tags);

	const positions = React.useMemo<Array<[number, number]>>(
		() => locations.map((location) => [location.lat, location.lng]),
		[locations],
	);

	/** Each location's resolved tag color(s), keyed by location id, so both markers and note-connection lines can reuse them. */
	const colorsByLocationId = React.useMemo(() => {
		const map = new Map<number, string[]>();
		for (const location of locations) {
			const colors =
				location.tags.length > 0
					? Array.from(
							new Set(
								location.tags.map(
									(tag) =>
										tagColorMap.get(tag.toLowerCase()) || DEFAULT_MARKER_COLOR,
								),
							),
						)
					: [DEFAULT_MARKER_COLOR];
			map.set(location.id, colors);
		}
		return map;
	}, [locations, tagColorMap]);

	/** Groups of 2+ locations that belong to the same note, connected on the map by a dashed line. */
	const sameNoteConnections = React.useMemo(() => {
		const groups = new Map<number, NoteLocationResponseDto[]>();
		for (const location of locations) {
			const group = groups.get(location.noteId);
			if (group) {
				group.push(location);
			} else {
				groups.set(location.noteId, [location]);
			}
		}
		return Array.from(groups.values()).filter((group) => group.length > 1);
	}, [locations]);

	return (
		<div className={className}>
			<LeafletMap
				center={DEFAULT_MAP_CENTER}
				zoom={DEFAULT_MAP_ZOOM}
				className="h-full w-full"
			>
				<FitBoundsToMarkers positions={positions} />
				{sameNoteConnections.map((group) => (
					<Polyline
						key={`connection-${group[0].noteId}`}
						positions={group.map((location): [number, number] => [
							location.lat,
							location.lng,
						])}
						pathOptions={{
							color:
								colorsByLocationId.get(group[0].id)?.[0] ??
								DEFAULT_MARKER_COLOR,
							weight: 2,
							opacity: 0.75,
							dashArray: "6 8",
						}}
					/>
				))}
				{locations.map((location) => {
					const colors = colorsByLocationId.get(location.id) ?? [
						DEFAULT_MARKER_COLOR,
					];

					return (
						<LeafletMarker
							key={location.id}
							position={[location.lat, location.lng]}
							icon={getTagMarkerIcon(colors)}
						>
							<Popup>
								<div className="flex flex-col gap-2 min-w-40">
									<div className="flex items-center gap-1.5 text-sm font-bold">
										<MapPin className="h-3.5 w-3.5 text-palm shrink-0" />
										<span className="truncate">
											{location.label || location.noteLabel}
										</span>
									</div>
									{location.label && (
										<p className="text-xs text-muted-foreground truncate">
											From note: {location.noteLabel}
										</p>
									)}
									<Button asChild size="xs" variant="outline">
										<Link
											to="/projects/$projectId/notes"
											params={{ projectId }}
											search={{ noteId: location.noteId }}
										>
											Open note
										</Link>
									</Button>
								</div>
							</Popup>
						</LeafletMarker>
					);
				})}
			</LeafletMap>
		</div>
	);
}
