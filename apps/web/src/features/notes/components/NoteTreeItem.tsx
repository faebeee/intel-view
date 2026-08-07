import type { NoteResponseDto as Note } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import {
	ChevronDown,
	ChevronRight,
	CornerDownRight,
	Edit2,
	Eye,
	MapPin,
	Plus,
	Trash2,
} from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import type { NoteTreeNode } from "#/features/notes/utils/noteTree.ts";

type NoteTreeItemProps = {
	node: NoteTreeNode;
	depth: number;
	projectIdParam: string;
	tagColorMap: Map<string, string>;
	isCollapsed: (noteId: number) => boolean;
	onToggleCollapse: (noteId: number) => void;
	forceExpanded: boolean;
	onView: (note: Note) => void;
	onAddChild: (note: Note) => void;
	onDelete: (note: Note) => void;
	isDeletePending: (noteId: number) => boolean;
};

export function NoteTreeItem({
	node,
	depth,
	projectIdParam,
	tagColorMap,
	isCollapsed,
	onToggleCollapse,
	forceExpanded,
	onView,
	onAddChild,
	onDelete,
	isDeletePending,
}: NoteTreeItemProps) {
	const { note, children } = node;
	const hasChildren = children.length > 0;
	const collapsed = hasChildren && !forceExpanded && isCollapsed(note.id);

	const hasCoords =
		note.lat !== null &&
		note.lat !== undefined &&
		note.lng !== null &&
		note.lng !== undefined;

	const content = note.content || "";
	const truncated =
		content.length > 100 ? `${content.substring(0, 100)}...` : content;
	const tags = note.tags || [];

	return (
		<div className="flex flex-col">
			<div
				className="group flex flex-wrap items-center gap-2 py-2.5 px-2 border-b border-line/40 hover:bg-palm/5 transition-colors"
				style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
			>
				{/* Expand/collapse chevron or spacer + nesting indicator */}
				<div className="flex items-center shrink-0 w-5">
					{hasChildren ? (
						<button
							type="button"
							onClick={() => onToggleCollapse(note.id)}
							className="text-muted-foreground hover:text-palm transition-colors"
							title={collapsed ? "Expand sub-notes" : "Collapse sub-notes"}
						>
							{collapsed ? (
								<ChevronRight className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</button>
					) : depth > 0 ? (
						<CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/40" />
					) : null}
				</div>

				<Link
					to="/projects/$projectId/notes/$id"
					params={{ projectId: projectIdParam, id: String(note.id) }}
					className="font-mono text-xs font-bold text-palm hover:underline shrink-0"
				>
					#{note.id}
				</Link>

				<NoteTypeBadge type={note.type} />

				<Link
					to="/projects/$projectId/notes/$id"
					params={{ projectId: projectIdParam, id: String(note.id) }}
					className="text-xs font-sans text-sea-ink hover:text-palm hover:underline no-underline transition-colors flex-1 min-w-[120px] truncate"
					title="Click to view note details"
				>
					{truncated || (
						<span className="italic text-muted-foreground">No content</span>
					)}
				</Link>

				<TagChipList
					tags={tags}
					tagColorMap={tagColorMap}
					className="shrink-0"
				/>

				{hasChildren && (
					<span
						className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/70 shrink-0"
						title="Number of direct sub-notes"
					>
						{children.length} sub-note{children.length === 1 ? "" : "s"}
					</span>
				)}

				<div className="flex items-center gap-1.5 shrink-0 ml-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
					<Button
						variant="outline"
						size="xs"
						title="Quick view note"
						onClick={() => onView(note)}
					>
						<Eye className="h-3 w-3" />
					</Button>
					<Button variant="outline" size="xs" title="Edit note" asChild>
						<Link
							to="/projects/$projectId/notes/$id/edit"
							params={{ projectId: projectIdParam, id: String(note.id) }}
						>
							<Edit2 className="h-3 w-3" />
						</Link>
					</Button>
					<Button
						variant="outline"
						size="xs"
						title="Add sub-note"
						onClick={() => onAddChild(note)}
					>
						<Plus className="h-3 w-3" />
					</Button>
					<ConfirmationButton
						variant="outline"
						size="xs"
						onClick={() => onDelete(note)}
						disabled={isDeletePending(note.id)}
						title="Delete Note"
						description={
							hasChildren
								? `Are you sure you want to permanently delete note #${note.id} and its ${children.length} sub-note(s)?`
								: `Are you sure you want to permanently delete note #${note.id}?`
						}
						confirmText="Delete"
					>
						<Trash2 className="h-3 w-3" />
					</ConfirmationButton>
					{hasCoords && (
						<Link
							to="/projects/$projectId/map"
							params={{ projectId: projectIdParam }}
							className="inline-flex items-center gap-1 px-2 py-1 rounded bg-palm/10 border border-palm/20 hover:bg-palm/25 text-palm text-[10px] font-mono font-bold uppercase tracking-wider transition-colors no-underline"
							title="Locate on map"
						>
							<MapPin className="h-3 w-3" />
						</Link>
					)}
				</div>
			</div>

			{hasChildren && !collapsed && (
				<div className="flex flex-col">
					{children.map((child) => (
						<NoteTreeItem
							key={child.note.id}
							node={child}
							depth={depth + 1}
							projectIdParam={projectIdParam}
							tagColorMap={tagColorMap}
							isCollapsed={isCollapsed}
							onToggleCollapse={onToggleCollapse}
							forceExpanded={forceExpanded}
							onView={onView}
							onAddChild={onAddChild}
							onDelete={onDelete}
							isDeletePending={isDeletePending}
						/>
					))}
				</div>
			)}
		</div>
	);
}
