import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Paperclip, ScrollText, StickyNote, Trash2 } from "lucide-react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { cn } from "#/lib/utils.ts";
import type { NoteNodeData } from "../types";

type NoteNodeProps = NodeProps & {
	data: NoteNodeData;
};

/**
 * Custom React Flow node rendering a note as a draggable card. Clicking
 * selects the note (surfaced via React Flow's own `selected` state, read by
 * the canvas route to open the details side panel); right-click opens a
 * context menu to delete the note. The handles allow dragging a connection
 * to/from another node to (re)parent notes, which draws the "hierarchy"
 * edge between them.
 */
export function NoteNode({ data, selected }: NoteNodeProps) {
	const { note } = data;
	const { data: tags = [] } = useAllTagsQuery(note.projectId);
	const tagColorMap = useTagColorMap(tags);
	const label = getNoteLabel(note);
	const snippet = (note.content || "").trim().replace(/\s+/g, " ");

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={cn(
						"w-60 rounded-lg border bg-surface-strong/90 backdrop-blur-sm p-3 shadow-lg transition-colors cursor-pointer",
						selected
							? "border-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
							: "border-line/60 hover:border-primary/50",
					)}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="!bg-primary !w-2 !h-2 !border-none"
					/>
					<Handle
						type="source"
						position={Position.Bottom}
						className="!bg-primary !w-2 !h-2 !border-none"
					/>

					<div className="flex items-start justify-between gap-2">
						<h3 className="font-sans text-xs font-bold text-sea-ink line-clamp-2">
							{label}
						</h3>
						{note.type === "log" ? (
							<ScrollText className="h-3.5 w-3.5 text-primary shrink-0" />
						) : note.type === "file" ? (
							<Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
						) : (
							<StickyNote className="h-3.5 w-3.5 text-primary shrink-0" />
						)}
					</div>

					{snippet && (
						<p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
							{snippet}
						</p>
					)}

					{note.tags && note.tags.length > 0 && (
						<TagChipList
							tags={note.tags}
							tagColorMap={tagColorMap}
							className="mt-2"
						/>
					)}

					<div className="mt-2 flex items-center justify-between">
						<span className="text-[9px] font-mono text-muted-foreground/60">
							#{note.id}
						</span>
					</div>
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					variant="destructive"
					onSelect={() => data.onDelete?.(note.id)}
				>
					<Trash2 className="h-3.5 w-3.5" />
					Delete note
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
}

export default NoteNode;
