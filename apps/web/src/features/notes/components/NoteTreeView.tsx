import type { NoteResponseDto as Note } from "@repo/sdk";
import { FileText } from "lucide-react";
import * as React from "react";
import { Input } from "#/components/ui/input.tsx";
import { NoteTreeItem } from "#/features/notes/components/NoteTreeItem.tsx";
import { buildNoteTree, type NoteTreeNode } from "#/features/notes/utils/noteTree.ts";

type NoteTreeViewProps = {
	notes: Note[];
	projectIdParam: string;
	tagColorMap: Map<string, string>;
	onView: (note: Note) => void;
	onAddChild: (note: Note) => void;
	onDelete: (note: Note) => void;
	isDeletePending: (noteId: number) => boolean;
};

function filterTreeBySearch(
	nodes: NoteTreeNode[],
	matches: Set<number>,
): NoteTreeNode[] {
	const result: NoteTreeNode[] = [];
	for (const node of nodes) {
		const filteredChildren = filterTreeBySearch(node.children, matches);
		if (matches.has(node.note.id) || filteredChildren.length > 0) {
			result.push({ note: node.note, children: filteredChildren });
		}
	}
	return result;
}

export function NoteTreeView({
	notes,
	projectIdParam,
	tagColorMap,
	onView,
	onAddChild,
	onDelete,
	isDeletePending,
}: NoteTreeViewProps) {
	const [searchText, setSearchText] = React.useState("");
	const [collapsedIds, setCollapsedIds] = React.useState<Set<number>>(
		new Set(),
	);

	const toggleCollapse = React.useCallback((noteId: number) => {
		setCollapsedIds((prev) => {
			const next = new Set(prev);
			if (next.has(noteId)) {
				next.delete(noteId);
			} else {
				next.add(noteId);
			}
			return next;
		});
	}, []);

	const isCollapsed = React.useCallback(
		(noteId: number) => collapsedIds.has(noteId),
		[collapsedIds],
	);

	const tree = React.useMemo(() => buildNoteTree(notes), [notes]);

	const trimmedSearch = searchText.trim().toLowerCase();
	const isSearching = trimmedSearch.length > 0;

	const visibleTree = React.useMemo(() => {
		if (!isSearching) return tree;
		const matches = new Set(
			notes
				.filter((note) => (note.content || "").toLowerCase().includes(trimmedSearch))
				.map((note) => note.id),
		);
		return filterTreeBySearch(tree, matches);
	}, [tree, notes, isSearching, trimmedSearch]);

	// While searching, force everything expanded so matches (and their
	// ancestors) are always visible regardless of manual collapse state.

	return (
		<div className="flex flex-col gap-3">
			<Input
				type="text"
				placeholder="Search notes by content..."
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				className="max-w-sm bg-[#040814]/40 border border-line/50 rounded-lg text-xs font-mono h-9 text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
			/>

			<div className="rounded-lg border border-line bg-surface-strong/60 overflow-hidden">
				{visibleTree.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
						<FileText className="h-6 w-6 opacity-40" />
						<span className="text-xs font-mono">
							{isSearching ? "No notes match your search." : "No notes yet."}
						</span>
					</div>
				) : (
					visibleTree.map((node) => (
						<NoteTreeItem
							key={node.note.id}
							node={node}
							depth={0}
							projectIdParam={projectIdParam}
							tagColorMap={tagColorMap}
							isCollapsed={isCollapsed}
							onToggleCollapse={toggleCollapse}
							forceExpanded={isSearching}
							onView={onView}
							onAddChild={onAddChild}
							onDelete={onDelete}
							isDeletePending={isDeletePending}
						/>
					))
				)}
			</div>
		</div>
	);
}
