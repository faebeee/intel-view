import { Link } from "@tanstack/react-router";
import {
	Calendar,
	Compass,
	CornerDownRight,
	Edit2,
	MapPin,
	X,
} from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button";
import { NoteContentRenderer } from "#/features/notes/components/NoteContentRenderer";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery";
import { useNoteQuery } from "#/features/notes/hooks/useNoteQuery";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery";
import { useMap } from "../hooks/useMap";

type NoteDetailPanelProps = {
	projectId: number;
};

/**
 * Persistent right-side detail panel showing the full details of the
 * currently selected map marker/note (fetched fresh via `useNoteQuery` so it
 * always has the complete note, not just the trimmed `MapMarkerData` used
 * for rendering pins).
 *
 * Unlike a modal/sheet overlay, this panel is a regular flex sibling of the
 * map area: when it opens it squeezes the map's width rather than covering
 * it with a blocking backdrop, so the map (and the rest of the page) stays
 * fully interactive while the panel is open.
 */
export function NoteDetailPanel({ projectId }: NoteDetailPanelProps) {
	const { selectedMarker, setSelectedMarker, map } = useMap();

	const noteId = selectedMarker ? Number(selectedMarker.id) : Number.NaN;
	const open = selectedMarker !== null;

	const { data: note, isLoading } = useNoteQuery(projectId, noteId);
	const { data: availableTags = [] } = useAllTagsQuery(projectId);
	const { data: allNotes = [] } = useAllNotesQuery(projectId);

	const tagColorMap = React.useMemo(() => {
		const colorMap = new Map<string, string>();
		for (const tag of availableTags) {
			colorMap.set(tag.name.toLowerCase(), tag.color);
		}
		return colorMap;
	}, [availableTags]);

	const parentNote =
		note?.parentId !== null && note?.parentId !== undefined
			? allNotes.find((n) => n.id === note.parentId)
			: undefined;
	const childNotes = note
		? allNotes.filter((n) => n.parentId === note.id)
		: [];

	const hasCoords =
		note?.lat !== null &&
		note?.lat !== undefined &&
		note?.lng !== null &&
		note?.lng !== undefined;

	const formattedDate = note
		? new Date(note.createdAt).toLocaleString([], {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	if (!open) {
		return null;
	}

	const tags = note?.tags || [];
	const projectIdParam = String(projectId);

	return (
		<div className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 bg-surface-strong/95 backdrop-blur-md animate-in fade-in slide-in-from-right duration-200 overflow-hidden">
			{isLoading || !note ? (
				<div className="flex-1 flex items-center justify-center py-40 font-mono text-xs text-[#00f2ff]">
					<div className="animate-pulse">Loading note details...</div>
				</div>
			) : (
				<>
					<div className="p-4 border-b border-line flex flex-col gap-1 shrink-0">
						<div className="flex items-start justify-between gap-2">
							<div className="space-y-0.5">
								<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-bold font-mono">
									Note Registry
								</span>
								<h2 className="flex items-center gap-2 font-mono font-semibold text-sea-ink text-sm">
									<span>Note #{note.id}</span>
									<NoteTypeBadge type={note.type} />
								</h2>
							</div>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={() => setSelectedMarker(null)}
								title="Close"
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
						{parentNote && (
							<Link
								to="/projects/$projectId/notes/$id"
								params={{
									projectId: projectIdParam,
									id: String(parentNote.id),
								}}
								className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-palm transition-colors no-underline w-fit"
							>
								<CornerDownRight className="h-3 w-3" />
								<span>
									Nested under: Note #{parentNote.id} —{" "}
									{(parentNote.content || "").slice(0, 40) || "No content"}
								</span>
							</Link>
						)}
					</div>

					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{/* Metadata */}
						<div className="text-xs text-muted-foreground flex flex-col gap-1.5 pb-3 border-b border-line/40">
							<span className="flex items-center gap-1.5">
								<Calendar className="h-3.5 w-3.5 text-palm" />
								<span>Created: {formattedDate}</span>
							</span>
							<span className="flex items-center gap-1.5">
								<MapPin className="h-3.5 w-3.5 text-palm" />
								{hasCoords ? (
									<span className="font-mono">
										Coordinates: [{note.lat?.toFixed(6)},{" "}
										{note.lng?.toFixed(6)}]
									</span>
								) : (
									<span className="italic text-muted-foreground/60">
										Non-geolocated note
									</span>
								)}
							</span>
						</div>

						{/* Tags */}
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								{tags.map((tag) => {
									const displayColor =
										tagColorMap.get(tag.toLowerCase()) || "#00f2ff";
									return (
										<span
											key={tag}
											className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shadow-sm"
											style={{
												backgroundColor: `${displayColor}12`,
												borderColor: `${displayColor}35`,
												color: displayColor,
											}}
										>
											{tag}
										</span>
									);
								})}
							</div>
						)}

						{/* Content */}
						<div className="rounded-lg border border-line bg-[#040814]/35 p-4">
							<NoteContentRenderer note={note} />
						</div>

						{/* Sub-notes */}
						{childNotes.length > 0 && (
							<div className="space-y-2">
								<h3 className="text-xs font-bold uppercase tracking-wider text-sea-ink">
									Sub-notes ({childNotes.length})
								</h3>
								<div className="flex flex-col gap-1.5">
									{childNotes.map((child) => (
										<Link
											key={child.id}
											to="/projects/$projectId/notes/$id"
											params={{
												projectId: projectIdParam,
												id: String(child.id),
											}}
											className="flex items-center gap-2 px-3 py-2 rounded border border-line/50 bg-surface-strong/40 hover:bg-palm/5 hover:border-palm/30 transition-colors no-underline text-inherit"
										>
											<CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
											<span className="font-mono text-xs font-bold text-palm shrink-0">
												#{child.id}
											</span>
											<NoteTypeBadge type={child.type} />
											<span className="text-xs font-sans truncate flex-1">
												{(child.content || "").slice(0, 60) || (
													<span className="italic text-muted-foreground">
														No content
													</span>
												)}
											</span>
										</Link>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="border-t border-line p-4 flex gap-2 shrink-0">
						<Button
							variant="outline"
							size="xs"
							onClick={() => {
								if (map && hasCoords) {
									map.flyTo([note.lat as number, note.lng as number], 16, {
										animate: true,
										duration: 0.8,
									});
								}
							}}
							disabled={!hasCoords}
						>
							<Compass className="h-3 w-3" />
							<span>Zoom</span>
						</Button>
						<Link
							to="/projects/$projectId/notes/$id/edit"
							params={{ projectId: projectIdParam, id: String(note.id) }}
							className="flex-1"
						>
							<Button variant="outline" size="xs" className="w-full">
								<Edit2 className="h-3 w-3" />
								<span>Edit</span>
							</Button>
						</Link>
						<Link
							to="/projects/$projectId/notes/$id"
							params={{ projectId: projectIdParam, id: String(note.id) }}
							className="flex-1"
						>
							<Button variant="outline" size="xs" className="w-full">
								<span>Full Page</span>
							</Button>
						</Link>
					</div>
				</>
			)}
		</div>
	);
}
export default NoteDetailPanel;
