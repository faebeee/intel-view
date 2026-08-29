import type { NoteLocationResponseDto, NoteResponseDto } from "@repo/sdk";
import { MapPin, Search, StickyNote } from "lucide-react";
import * as React from "react";
import { Input } from "#/components/ui/input.tsx";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import {
	buildNoteChildrenMap,
	flattenNoteTree,
	getNoteLabel,
} from "#/features/notes/hooks/useNoteTree.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { cn } from "#/lib/utils.ts";

export type NotesMapSidebarProps = {
	notes: NoteResponseDto[];
	locations: NoteLocationResponseDto[];
	/** Currently selected note id, whose locations (if any) are exclusively shown on the map. `null` shows every note's locations. */
	selectedNoteId: number | null;
	/** Called with a note's id when clicked; clicking the already-selected note is expected to deselect it (handled by the caller). */
	onSelectNote: (noteId: number) => void;
	className?: string;
};

/**
 * Right-hand sidebar for the project map view: a searchable list of every
 * note in the project, indented to reflect its nesting level in the parent
 * hierarchy (like `NoteTree`, but always fully expanded rather than
 * collapsible). Each row shows the note's label, tags, and how many map
 * locations it has. Clicking a note toggles it as the map's "focused" note,
 * filtering the plotted locations down to just that note's pins (see
 * `map.tsx`, which owns `selectedNoteId` state and passes the filtered
 * `locations` prop to `AllLocationsMap`).
 */
export function NotesMapSidebar({
	notes,
	locations,
	selectedNoteId,
	onSelectNote,
	className,
}: NotesMapSidebarProps) {
	const [search, setSearch] = React.useState("");
	const { data: tags = [] } = useAllTagsQuery();
	const tagColorMap = useTagColorMap(tags);

	const locationCountByNoteId = React.useMemo(() => {
		const map = new Map<number, number>();
		for (const location of locations) {
			map.set(location.noteId, (map.get(location.noteId) ?? 0) + 1);
		}
		return map;
	}, [locations]);

	/** Every note in nesting (pre-order, depth-first) order, so indentation reflects the parent hierarchy. */
	const notesWithDepth = React.useMemo(
		() => flattenNoteTree(buildNoteChildrenMap(notes)),
		[notes],
	);

	const trimmedQuery = search.trim().toLowerCase();

	/**
	 * When searching, hierarchy no longer applies cleanly (matches can be
	 * scattered across unrelated branches), so we fall back to a flat,
	 * unindented list of just the matching notes. Without a search, the
	 * full nested list (with depth-based indentation) is shown instead.
	 */
	const visibleNotesWithDepth = React.useMemo(() => {
		if (!trimmedQuery) return notesWithDepth;
		return notesWithDepth
			.filter(({ note }) => {
				const label = getNoteLabel(note).toLowerCase();
				if (label.includes(trimmedQuery)) return true;
				return (note.tags ?? []).some((tag) =>
					tag.toLowerCase().includes(trimmedQuery),
				);
			})
			.map(({ note }) => ({ note, depth: 0 }));
	}, [notesWithDepth, trimmedQuery]);

	return (
		<div className={cn("flex flex-col min-h-0", className)}>
			<div className="p-3 border-b border-line shrink-0">
				<div className="relative">
					<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
					<Input
						placeholder="Search notes..."
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						className="h-8 pl-8 text-xs"
					/>
				</div>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto p-2">
				{visibleNotesWithDepth.length === 0 ? (
					<p className="text-xs text-muted-foreground text-center py-6 px-2">
						{notes.length === 0
							? "No notes yet."
							: "No notes match your search."}
					</p>
				) : (
					<ul className="flex flex-col gap-1">
						{visibleNotesWithDepth.map(({ note, depth }) => {
							const locationCount = locationCountByNoteId.get(note.id) ?? 0;
							const hasLocations = locationCount > 0;
							const isSelected = selectedNoteId === note.id;

							return (
								<li key={note.id}>
									<button
										type="button"
										onClick={() => onSelectNote(note.id)}
										style={{ paddingLeft: `${depth * 14 + 8}px` }}
										className={cn(
											"w-full flex flex-col gap-1 rounded-md py-1.5 pr-2 text-left text-xs transition-colors",
											isSelected
												? "bg-accent/15 text-palm"
												: "text-sea-ink-soft hover:bg-surface-strong/60",
											!hasLocations && !isSelected && "opacity-60",
										)}
									>
										<div className="flex items-center gap-1.5">
											<StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" />
											<span className="truncate font-medium flex-1">
												{getNoteLabel(note)}
											</span>
											{hasLocations && (
												<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
													<MapPin className="h-3 w-3" />
													{locationCount}
												</span>
											)}
										</div>
										{note.tags && note.tags.length > 0 && (
											<TagChipList
												tags={note.tags}
												tagColorMap={tagColorMap}
												size="xs"
											/>
										)}
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
