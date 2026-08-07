import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "#/components/ui/context-menu.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import type { NoteNodeData } from "../types";

type NoteNodeProps = NodeProps & {
	data: NoteNodeData;
};

/**
 * Custom React Flow node rendering a note as a draggable card. Right-click
 * opens a context menu to delete the note; the handles allow dragging a
 * connection to/from another node to (re)parent notes, which draws the
 * visible edge between them.
 */
export function NoteNode({ data, selected }: NoteNodeProps) {
	const { note } = data;
	const contentClean = (note.content || "").trim();
	const lines = contentClean.split("\n");
	const title = lines[0] || `Note #${note.id}`;
	const description = lines.length > 1 ? lines.slice(1).join(" ") : "";

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>
				<div
					className={`w-60 rounded-lg border bg-surface-strong/90 backdrop-blur-sm p-3 shadow-lg transition-colors ${
						selected
							? "border-palm shadow-[0_0_12px_rgba(0,242,255,0.15)]"
							: "border-line/60 hover:border-palm/50"
					}`}
				>
					<Handle
						type="target"
						position={Position.Top}
						className="!bg-palm !w-2 !h-2 !border-none"
					/>
					<Handle
						type="source"
						position={Position.Bottom}
						className="!bg-palm !w-2 !h-2 !border-none"
					/>

					<div className="flex items-start justify-between gap-2">
						<h3 className="font-sans text-xs font-bold text-sea-ink line-clamp-2">
							{title}
						</h3>
						<NoteTypeBadge type={note.type} className="shrink-0" />
					</div>

					{description && (
						<p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
							{description}
						</p>
					)}

					{note.tags && note.tags.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-2">
							{note.tags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border border-palm/30 bg-palm/10 text-palm"
								>
									{tag}
								</span>
							))}
						</div>
					)}

					<div className="mt-2 flex items-center justify-between">
						<span className="text-[9px] font-mono text-muted-foreground/60">
							#{note.id}
						</span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								data.onView?.(note.id);
							}}
							className="text-[9px] font-mono uppercase tracking-wider text-palm hover:underline"
						>
							Details
						</button>
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
