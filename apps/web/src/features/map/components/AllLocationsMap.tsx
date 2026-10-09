import type { NoteLocationResponseDto, NoteResponseDto } from "@repo/sdk";
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
import type { MapThemeId } from "#/features/map/lib/map-themes.ts";
import {
	DEFAULT_MARKER_COLOR,
	getTagMarkerIcon,
} from "#/features/map/lib/tag-marker-icon.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { extractNoteReferenceIds } from "#/lib/note-references.ts";

/** Dashed line color for `[[NOTE_ID]]` reference connections, matching the canvas view's reference-edge styling. */
const REFERENCE_LINE_COLOR = "var(--reference-link)";

/** The average lat/lng of a group of location pins, used as a single connectable point for a note that may have multiple pins. */
function centroidOf(group: NoteLocationResponseDto[]): [number, number] {
	return [
		group.reduce((sum, location) => sum + location.lat, 0) / group.length,
		group.reduce((sum, location) => sum + location.lng, 0) / group.length,
	];
}

/**
 * Builds an undirected adjacency list over every note's parent/child
 * relations (a parent/child edge connects two notes regardless of which
 * direction it's traversed from), used to find the nearest *located*
 * neighbor(s) of a note by hopping through any number of unlocated notes
 * in between, in any direction (up through parents, down through
 * children, or sideways through a shared relative).
 */
function buildNoteAdjacency(
	notes: NoteResponseDto[],
): Map<number, Set<number>> {
	const adjacency = new Map<number, Set<number>>();
	const link = (a: number, b: number) => {
		if (a === b) return;
		if (!adjacency.has(a)) adjacency.set(a, new Set());
		if (!adjacency.has(b)) adjacency.set(b, new Set());
		adjacency.get(a)?.add(b);
		adjacency.get(b)?.add(a);
	};
	for (const note of notes) {
		for (const parentId of note.parentIds ?? []) {
			link(note.id, parentId);
		}
		for (const childId of note.childIds ?? []) {
			link(note.id, childId);
		}
	}
	return adjacency;
}

/**
 * Finds every note's nearest *located* relative(s) by walking the
 * parent/child relation graph outward in every direction, passing
 * straight through any purely organizational/text notes that don't have
 * a location of their own (e.g. a "Family" grouping note sitting between
 * two addresses) — stopping and recording a connection as soon as a
 * located note is reached along each branch, without continuing further
 * past it (so a long chain of several located notes gets one line per
 * hop, not a line between every pair). Returns each located note's id
 * mapped to the set of other located note ids connected to it this way.
 * Guards against cycles via a per-note `visited` set.
 */
function findNearestLocatedNeighbors(
	notes: NoteResponseDto[],
	locationsByNoteId: Map<number, NoteLocationResponseDto[]>,
): Map<number, Set<number>> {
	const adjacency = buildNoteAdjacency(notes);
	const result = new Map<number, Set<number>>();

	for (const noteId of locationsByNoteId.keys()) {
		const found = new Set<number>();
		const visited = new Set<number>([noteId]);
		const queue: number[] = [...(adjacency.get(noteId) ?? [])];

		while (queue.length > 0) {
			const candidateId = queue.shift();
			if (candidateId === undefined || visited.has(candidateId)) continue;
			visited.add(candidateId);

			if (locationsByNoteId.has(candidateId)) {
				found.add(candidateId);
				continue;
			}

			for (const neighborId of adjacency.get(candidateId) ?? []) {
				if (!visited.has(neighborId)) queue.push(neighborId);
			}
		}

		result.set(noteId, found);
	}

	return result;
}

/**
 * Imperatively fits the map's viewport to contain every given point once per
 * `fitKey` (e.g. the currently focused note id) — so switching which note is
 * focused in the sidebar re-frames the map around its pins, while unrelated
 * re-renders/refetches that don't change `fitKey` don't keep yanking the
 * viewport back.
 */
function FitBoundsToMarkers({
	positions,
	fitKey,
}: {
	positions: Array<[number, number]>;
	fitKey: string | number;
}) {
	const map = useMap();
	const fittedKeyRef = React.useRef<string | number | null>(null);

	React.useEffect(() => {
		if (fittedKeyRef.current === fitKey || positions.length === 0) return;
		fittedKeyRef.current = fitKey;
		if (positions.length === 1) {
			map.setView(positions[0], 13);
			return;
		}
		map.fitBounds(L.latLngBounds(positions), { padding: [32, 32] });
	}, [map, positions, fitKey]);

	return null;
}

export type AllLocationsMapProps = {
	projectId: string;
	locations: NoteLocationResponseDto[];
	/** Every note in the project, used to resolve both the parent/child hierarchy (for the solid connection lines) and `[[NOTE_ID]]` references in note content (for the dashed reference connection lines). Omit to skip drawing either. */
	notes?: NoteResponseDto[];
	/** The currently focused note (if any), used only to key `FitBoundsToMarkers` so re-framing happens whenever the sidebar's selection changes, not just once ever. */
	selectedNoteId?: number | null;
	/** Called with a note's id when one of its markers is clicked, so the caller can focus that note (e.g. re-filtering/re-framing the map to just its locations) the same way clicking it in the sidebar does. */
	onNoteSelect?: (noteId: number) => void;
	/** Called with a note's id when one of its markers is double-clicked, so the caller can open an in-place editor (e.g. a modal) for that note. */
	onNoteDoubleClick?: (noteId: number) => void;
	/** The project's persisted base map theme, used as the layers control's initially-checked theme. Defaults to `DEFAULT_MAP_THEME` ('street') if omitted. */
	mapTheme?: MapThemeId;
	/** Called with the newly selected theme's id whenever the user switches base layers, so the caller can persist the choice (e.g. onto the `Project` entity). */
	onMapThemeChange?: (theme: MapThemeId) => void;
	className?: string;
};

/**
 * Read-only map plotting every location pin derived from every note in a
 * project. Clicking a marker focuses its owning note (via `onNoteSelect`,
 * re-framing/filtering the map the same way selecting it in the sidebar
 * does) and opens a popup with the note's label and a link to open it in
 * the Notes editor. Reusable wherever a project-wide "all note locations"
 * overview is needed (currently the `/projects/$projectId/map` route).
 */
export function AllLocationsMap({
	projectId,
	locations,
	notes,
	selectedNoteId,
	onNoteSelect,
	onNoteDoubleClick,
	mapTheme,
	onMapThemeChange,
	className,
}: AllLocationsMapProps) {
	const { data: tags = [] } = useAllTagsQuery();
	const tagColorMap = useTagColorMap(tags);

	const positions = React.useMemo<Array<[number, number]>>(
		() => locations.map((location) => [location.lat, location.lng]),
		[locations],
	);

	/** Each location's resolved tag color(s), keyed by location id, so both markers and note-connection lines can reuse them. A note's own custom `color` (if set) wins outright as a single solid color; otherwise falls back to every tag's color (rendered as a gradient when there's more than one). */
	const colorsByLocationId = React.useMemo(() => {
		const map = new Map<number, string[]>();
		for (const location of locations) {
			if (location.color) {
				map.set(location.id, [location.color]);
				continue;
			}
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

	/** Every visible location grouped by its owning note id, reused for both same-note and parent-child connection lines. */
	const locationsByNoteId = React.useMemo(() => {
		const groups = new Map<number, NoteLocationResponseDto[]>();
		for (const location of locations) {
			const group = groups.get(location.noteId);
			if (group) {
				group.push(location);
			} else {
				groups.set(location.noteId, [location]);
			}
		}
		return groups;
	}, [locations]);

	/** Groups of 2+ locations that belong to the same note, connected on the map by a dashed line. */
	const sameNoteConnections = React.useMemo(
		() =>
			Array.from(locationsByNoteId.values()).filter(
				(group) => group.length > 1,
			),
		[locationsByNoteId],
	);

	/**
	 * Solid lines connecting each located note to its nearest *located*
	 * relative(s) in the parent/child relation graph — not necessarily a
	 * direct parent or child, since purely organizational/text notes
	 * without a pin of their own (e.g. a "Family" grouping note, or a
	 * shared hub note several of them are filed under) are passed straight
	 * through to find the next located note in every direction (up,
	 * down, or sideways via a shared relative — see
	 * `findNearestLocatedNeighbors`). One line per effective pair that
	 * both have at least one visible location, drawn between the centroid
	 * of each note's pins (so it still works cleanly when either side has
	 * multiple locations).
	 */
	const parentChildConnections = React.useMemo(() => {
		if (!notes || notes.length === 0) return [];

		const neighborsByNoteId = findNearestLocatedNeighbors(
			notes,
			locationsByNoteId,
		);
		const connections: Array<{
			key: string;
			positions: [[number, number], [number, number]];
			color: string;
		}> = [];
		const seenPairs = new Set<string>();

		for (const [noteId, neighborIds] of neighborsByNoteId) {
			const childLocations = locationsByNoteId.get(noteId);
			if (!childLocations) continue;

			for (const neighborId of neighborIds) {
				const pairKey = [noteId, neighborId].sort((a, b) => a - b).join("-");
				if (seenPairs.has(pairKey)) continue;
				seenPairs.add(pairKey);

				const neighborLocations = locationsByNoteId.get(neighborId);
				if (!neighborLocations) continue;

				connections.push({
					key: `parent-${pairKey}`,
					positions: [
						centroidOf(neighborLocations),
						centroidOf(childLocations),
					],
					color:
						colorsByLocationId.get(childLocations[0].id)?.[0] ??
						DEFAULT_MARKER_COLOR,
				});
			}
		}

		return connections;
	}, [notes, locationsByNoteId, colorsByLocationId]);

	/**
	 * Dashed lines connecting a note's location(s) to each note it
	 * references via `[[NOTE_ID]]` syntax in its content — mirroring the
	 * reference edges already drawn on the canvas view
	 * (`extractNoteReferenceIds`). Self-references and references to notes
	 * without any visible location are skipped. Drawn between the centroid
	 * of each note's pins, same as parent-child connections.
	 */
	const referenceConnections = React.useMemo(() => {
		if (!notes || notes.length === 0) return [];

		const connections: Array<{
			key: string;
			positions: [[number, number], [number, number]];
		}> = [];

		for (const note of notes) {
			const sourceLocations = locationsByNoteId.get(note.id);
			if (!sourceLocations) continue;

			for (const referencedId of extractNoteReferenceIds(note.content)) {
				if (referencedId === note.id) continue;
				const targetLocations = locationsByNoteId.get(referencedId);
				if (!targetLocations) continue;

				connections.push({
					key: `reference-${note.id}-${referencedId}`,
					positions: [centroidOf(sourceLocations), centroidOf(targetLocations)],
				});
			}
		}

		return connections;
	}, [notes, locationsByNoteId]);

	/**
	 * Dotted lines connecting every located note that shares at least one
	 * tag with another located note — one polyline per tag threading
	 * through the centroid of every note carrying it (sorted by note id
	 * for a stable, deterministic path), colored with that tag's own
	 * color. A note with multiple tags participates in multiple tag
	 * lines independently. Tags with only one (or zero) located notes are
	 * skipped, since there's nothing to connect.
	 */
	const tagConnections = React.useMemo(() => {
		const noteIdsByTag = new Map<string, Set<number>>();
		for (const location of locations) {
			for (const tag of location.tags) {
				const key = tag.toLowerCase();
				if (!noteIdsByTag.has(key)) noteIdsByTag.set(key, new Set());
				noteIdsByTag.get(key)?.add(location.noteId);
			}
		}

		const connections: Array<{
			key: string;
			positions: Array<[number, number]>;
			color: string;
		}> = [];

		for (const [tag, noteIds] of noteIdsByTag) {
			if (noteIds.size < 2) continue;

			const sortedNoteIds = [...noteIds].sort((a, b) => a - b);
			const tagPositions = sortedNoteIds
				.map((noteId) => locationsByNoteId.get(noteId))
				.filter((group): group is NoteLocationResponseDto[] => !!group)
				.map(centroidOf);
			if (tagPositions.length < 2) continue;

			connections.push({
				key: `tag-${tag}`,
				positions: tagPositions,
				color: tagColorMap.get(tag) ?? DEFAULT_MARKER_COLOR,
			});
		}

		return connections;
	}, [locations, locationsByNoteId, tagColorMap]);

	return (
		<div className={className}>
			<LeafletMap
				center={DEFAULT_MAP_CENTER}
				zoom={DEFAULT_MAP_ZOOM}
				className="h-full w-full"
				theme={mapTheme}
				onThemeChange={onMapThemeChange}
			>
				<FitBoundsToMarkers
					positions={positions}
					fitKey={selectedNoteId ?? "all"}
				/>
				{parentChildConnections.map((connection) => (
					<Polyline
						key={connection.key}
						positions={connection.positions}
						pathOptions={{
							color: connection.color,
							weight: 2,
							opacity: 0.75,
						}}
					/>
				))}
				{referenceConnections.map((connection) => (
					<Polyline
						key={connection.key}
						positions={connection.positions}
						pathOptions={{
							color: REFERENCE_LINE_COLOR,
							weight: 2,
							opacity: 0.75,
							dashArray: "4 4",
						}}
					/>
				))}
				{tagConnections.map((connection) => (
					<Polyline
						key={connection.key}
						positions={connection.positions}
						pathOptions={{
							color: connection.color,
							weight: 1.5,
							opacity: 0.5,
							dashArray: "1 6",
						}}
					/>
				))}
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
							eventHandlers={{
								...(onNoteSelect
									? { click: () => onNoteSelect(location.noteId) }
									: {}),
								...(onNoteDoubleClick
									? { dblclick: () => onNoteDoubleClick(location.noteId) }
									: {}),
							}}
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
