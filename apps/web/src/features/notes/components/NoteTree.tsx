import type {
	NoteResponseDto as Note,
	NoteLocationResponseDto as NoteLocation,
	TagResponseDto as Tag,
} from "@repo/sdk";
import { ChevronRight, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Collapsible,
	CollapsibleContent,
} from "#/components/ui/collapsible.tsx";
import { Input } from "#/components/ui/input.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import {
	buildNoteChildrenMap,
	flattenNoteTree,
	getChildNotes,
	getNoteLabel,
	getRootNotes,
	resolveNoteColor,
} from "#/features/notes/hooks/useNoteTree.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { cn } from "#/lib/utils.ts";

type NoteTreeProps = {
	notes: Note[];
	tags: Tag[];
	/** Map pins, used only to also match a note's pin labels ("location") when searching. Omitted on views without a map. */
	locations?: NoteLocation[];
	selectedNoteId: number | undefined;
	onSelect: (id: number) => void;
	onCreateChild: (parentId: number | null) => void;
	onDelete: (id: number) => void;
	/** Reports the current search match as a note-id set, or `null` while the search box is empty (no filter active) — lets a parent (e.g. the map) restrict what it shows to the same result. */
	onVisibleNoteIdsChange?: (ids: Set<number> | null) => void;
	isMutating?: boolean;
	className?: string;
};

/**
 * Left-column tree of a project's notes, grouped by parent/child relations
 * (a directed acyclic graph — a note may have multiple parents, in which
 * case it appears once under each). Each row can be expanded/collapsed (if
 * it has children), selected (opens it in the editor), given a child note,
 * or deleted (does not cascade — child notes remain, keeping any other
 * parent relations they have). A search field filters by note content,
 * location (geocoded address label or map pin labels), or tag; while
 * searching, matches are shown as a flat unindented list (the hierarchy no
 * longer applies cleanly since matches can be scattered across unrelated
 * branches) instead of the collapsible nested tree.
 */
export function NoteTree({
	notes,
	tags,
	locations = [],
	selectedNoteId,
	onSelect,
	onCreateChild,
	onDelete,
	onVisibleNoteIdsChange,
	isMutating = false,
	className,
}: NoteTreeProps) {
	const [search, setSearch] = React.useState("");
	const childrenMap = React.useMemo(() => buildNoteChildrenMap(notes), [notes]);
	const rootNotes = getRootNotes(childrenMap);
	const tagColorMap = useTagColorMap(tags);

	const trimmedQuery = search.trim().toLowerCase();

	/** Pin labels grouped by note id, so a note's location pins can be matched by search without an O(n*m) scan per note. */
	const locationLabelsByNoteId = React.useMemo(() => {
		const map = new Map<number, string[]>();
		for (const location of locations) {
			if (!location.label) continue;
			const labels = map.get(location.noteId) ?? [];
			labels.push(location.label);
			map.set(location.noteId, labels);
		}
		return map;
	}, [locations]);

	/**
	 * When searching, hierarchy no longer applies cleanly (matches can be
	 * scattered across unrelated branches), so we fall back to a flat,
	 * unindented list of just the matching notes instead of the
	 * collapsible nested tree. A note matches if the query is found in its
	 * label, its full content, its tags, its geocoded address label, or
	 * any of its map pin labels.
	 */
	const searchResults = React.useMemo(() => {
		if (!trimmedQuery) return [];
		return flattenNoteTree(childrenMap)
			.map(({ note }) => note)
			.filter((note) => {
				const label = getNoteLabel(note).toLowerCase();
				if (label.includes(trimmedQuery)) return true;
				if (note.content?.toLowerCase().includes(trimmedQuery)) return true;
				if (
					(note.tags ?? []).some((tag) =>
						tag.toLowerCase().includes(trimmedQuery),
					)
				)
					return true;
				const geocodedLabel =
					typeof note.geocodedLabel === "string" ? note.geocodedLabel : "";
				if (geocodedLabel.toLowerCase().includes(trimmedQuery)) return true;
				const pinLabels = locationLabelsByNoteId.get(note.id) ?? [];
				return pinLabels.some((pinLabel) =>
					pinLabel.toLowerCase().includes(trimmedQuery),
				);
			});
	}, [childrenMap, trimmedQuery, locationLabelsByNoteId]);

	React.useEffect(() => {
		if (!onVisibleNoteIdsChange) return;
		onVisibleNoteIdsChange(
			trimmedQuery ? new Set(searchResults.map((note) => note.id)) : null,
		);
	}, [onVisibleNoteIdsChange, trimmedQuery, searchResults]);

	return (
		<div className={cn("flex flex-col gap-2 h-full min-h-0", className)}>
			<div className="flex items-center justify-between px-1">
				<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft">
					Notes
				</span>
				<Button
					variant="outline"
					size="icon-xs"
					title="New root note"
					onClick={() => onCreateChild(null)}
					disabled={isMutating}
				>
					<Plus className="h-3 w-3" />
				</Button>
			</div>

			<div className="relative px-1">
				<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
				<Input
					placeholder="Search content, location, or tag..."
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					className="h-8 pl-8 text-xs"
				/>
			</div>

			<div className="flex-1 min-h-0 overflow-y-auto pr-1">
				{trimmedQuery ? (
					searchResults.length === 0 ? (
						<p className="text-xs text-muted-foreground px-1 py-4 text-center">
							No notes match your search.
						</p>
					) : (
						<div className="flex flex-col gap-0.5">
							{searchResults.map((note) => (
								<NoteTreeRow
									key={note.id}
									note={note}
									depth={0}
									isSelected={selectedNoteId === note.id}
									onSelect={onSelect}
									onCreateChild={onCreateChild}
									onDelete={onDelete}
									isMutating={isMutating}
									noteColor={resolveNoteColor(note, tagColorMap)}
								/>
							))}
						</div>
					)
				) : rootNotes.length === 0 ? (
					<p className="text-xs text-muted-foreground px-1 py-4 text-center">
						No notes yet. Create one to get started.
					</p>
				) : (
					<div className="flex flex-col gap-0.5">
						{rootNotes.map((note) => (
							<NoteTreeItem
								key={note.id}
								note={note}
								depth={0}
								childrenMap={childrenMap}
								selectedNoteId={selectedNoteId}
								onSelect={onSelect}
								onCreateChild={onCreateChild}
								onDelete={onDelete}
								isMutating={isMutating}
								tagColorMap={tagColorMap}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

type NoteTreeItemProps = {
	note: Note;
	depth: number;
	childrenMap: ReturnType<typeof buildNoteChildrenMap>;
	selectedNoteId: number | undefined;
	onSelect: (id: number) => void;
	onCreateChild: (parentId: number | null) => void;
	onDelete: (id: number) => void;
	isMutating: boolean;
	tagColorMap: Map<string, string>;
};

function NoteTreeItem({
	note,
	depth,
	childrenMap,
	selectedNoteId,
	onSelect,
	onCreateChild,
	onDelete,
	isMutating,
	tagColorMap,
}: NoteTreeItemProps) {
	const children = getChildNotes(childrenMap, note.id);
	const hasChildren = children.length > 0;
	const isSelected = selectedNoteId === note.id;
	const [open, setOpen] = React.useState(true);
	const noteColor = resolveNoteColor(note, tagColorMap);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<NoteTreeRow
				note={note}
				depth={depth}
				isSelected={isSelected}
				onSelect={onSelect}
				onCreateChild={onCreateChild}
				onDelete={onDelete}
				isMutating={isMutating}
				noteColor={noteColor}
				chevron={
					hasChildren
						? { open, onToggle: () => setOpen((prev) => !prev) }
						: undefined
				}
			/>

			{hasChildren && (
				<CollapsibleContent>
					{children.map((child) => (
						<NoteTreeItem
							key={child.id}
							note={child}
							depth={depth + 1}
							childrenMap={childrenMap}
							selectedNoteId={selectedNoteId}
							onSelect={onSelect}
							onCreateChild={onCreateChild}
							onDelete={onDelete}
							isMutating={isMutating}
							tagColorMap={tagColorMap}
						/>
					))}
				</CollapsibleContent>
			)}
		</Collapsible>
	);
}

type NoteTreeRowProps = {
	note: Note;
	depth: number;
	isSelected: boolean;
	onSelect: (id: number) => void;
	onCreateChild: (parentId: number | null) => void;
	onDelete: (id: number) => void;
	isMutating: boolean;
	noteColor: string | undefined;
	/** Present (with expand/collapse state) when this row has children to expand; omitted for leaf rows and flat search results, which show no chevron. */
	chevron?: { open: boolean; onToggle: () => void };
};

/**
 * A single note row shared by both the collapsible tree (`NoteTreeItem`,
 * indented by depth, with an expand/collapse chevron when it has children)
 * and the flat search-results list (always depth 0, no chevron) — so both
 * presentations stay visually consistent.
 */
function NoteTreeRow({
	note,
	depth,
	isSelected,
	onSelect,
	onCreateChild,
	onDelete,
	isMutating,
	noteColor,
	chevron,
}: NoteTreeRowProps) {
	return (
		<div
			className={cn(
				"group flex items-center gap-1 rounded-md px-1 py-1.5 text-xs",
				isSelected
					? "bg-accent/15 text-palm"
					: "text-sea-ink-soft hover:bg-surface-strong/60",
			)}
			style={{ paddingLeft: `${depth * 14 + 4}px` }}
		>
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					chevron?.onToggle();
				}}
				className={cn(
					"shrink-0 p-0.5 rounded hover:bg-surface-strong/80 text-muted-foreground",
					!chevron && "invisible",
				)}
			>
				<ChevronRight
					className={cn(
						"h-3 w-3 transition-transform",
						chevron?.open && "rotate-90",
					)}
				/>
			</button>

			<button
				type="button"
				onClick={() => onSelect(note.id)}
				className="flex items-center gap-1 flex-1 min-w-0 text-left cursor-pointer"
			>
				<StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" />
				{noteColor && (
					<span
						className="h-1.5 w-1.5 rounded-full shrink-0"
						style={{ backgroundColor: noteColor }}
						title="Note color"
					/>
				)}
				<span className="truncate font-medium">{getNoteLabel(note)}</span>
			</button>

			<div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
				<Button
					variant="ghost"
					size="icon-xs"
					title="Add child note"
					disabled={isMutating}
					onClick={() => onCreateChild(note.id)}
				>
					<Plus className="h-3 w-3" />
				</Button>
				<ConfirmationButton
					variant="ghost"
					size="icon-xs"
					title="Delete note"
					description={`Delete "${getNoteLabel(note)}"? Any notes linked to it as children will remain (losing this parent connection). This cannot be undone.`}
					confirmText="Delete"
					disabled={isMutating}
					onClick={() => onDelete(note.id)}
				>
					<Trash2 className="h-3 w-3" />
				</ConfirmationButton>
			</div>
		</div>
	);
}
