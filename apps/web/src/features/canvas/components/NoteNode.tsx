import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import {
	getNoteLabel,
	resolveNoteColor,
} from "#/features/notes/hooks/useNoteTree.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { cn } from "#/lib/utils.ts";
import { noteKind, noteSubtitle } from "../note-kind";
import type { NoteNodeData } from "../types";

type NoteNodeProps = NodeProps & {
	data: NoteNodeData;
};

const HANDLE_CLASS =
	"!size-2 !rounded-none !border !border-mc-border-strong !bg-mc-panel opacity-0 transition-opacity group-hover/node:opacity-100";

/**
 * A note on the canvas (handoff §03 "Note node"): 160px wide, 14px cut
 * corner, kind label + #id + status square, Chakra title, mono subtitle.
 *
 * The 1px edge is the outer element's background showing through its
 * padding (a border can't follow the cut). Handles and the selection glow
 * sit on an unclipped wrapper so the clip-path doesn't cut them off. The
 * React Flow node wrapper around this is focusable and carries the focus
 * ring (see `.react-flow__node:focus-visible` in styles.css). Clicking selects
 * (the inspector opens), double-click edits, right-click offers delete,
 * and the handles drag out a new parent/child link.
 */
export function NoteNode({ data, selected }: NoteNodeProps) {
	const { note } = data;
	const { data: tags = [] } = useAllTagsQuery();
	const tagColorMap = useTagColorMap(tags);
	const kind = noteKind(note);
	const statusColor = resolveNoteColor(note, tagColorMap) ?? "var(--mc-accent)";

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={cn(
						"group/node relative w-40 cursor-pointer",
						selected &&
							"drop-shadow-[0_0_14px_color-mix(in_srgb,var(--mc-accent)_35%,transparent)]",
					)}
				>
					<Handle
						type="target"
						position={Position.Top}
						className={cn(HANDLE_CLASS, selected && "opacity-100")}
					/>
					<div
						className={cn(
							"cut-tr-md p-px transition-colors",
							selected
								? "bg-mc-accent"
								: "bg-mc-border-strong group-hover/node:bg-mc-edge-idle",
						)}
					>
						<div className="cut-tr-md-inner flex min-h-[94px] flex-col gap-1.5 bg-mc-panel px-3 py-2.5">
							<div className="flex items-center gap-1.5">
								<span
									className="font-mono text-[9.5px] font-semibold tracking-[0.12em]"
									style={{ color: kind.color }}
								>
									{kind.label}
								</span>
								<span className="flex-1" />
								<span className="font-mono text-[10px] text-mc-text-muted">
									#{note.id}
								</span>
								<span
									aria-hidden="true"
									className="size-1.5 shrink-0"
									style={{ backgroundColor: statusColor }}
								/>
							</div>
							<span className="line-clamp-2 font-display text-[14.5px] leading-[1.2] font-semibold break-words text-mc-text">
								{getNoteLabel(note)}
							</span>
							<span className="truncate font-mono text-[10.5px] leading-[1.4] text-mc-text-2">
								{noteSubtitle(note)}
							</span>
						</div>
					</div>
					<Handle
						type="source"
						position={Position.Bottom}
						className={cn(HANDLE_CLASS, selected && "opacity-100")}
					/>
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
