import type { NoteResponseDto as Note } from "@repo/sdk";
import { ChevronRight, Plus, StickyNote, Trash2 } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import {
	buildNoteChildrenMap,
	getChildNotes,
	getNoteLabel,
	getRootNotes,
} from "#/features/notes/hooks/useNoteTree.ts";
import { cn } from "#/lib/utils.ts";

type NoteTreeProps = {
	notes: Note[];
	selectedNoteId: number | undefined;
	onSelect: (id: number) => void;
	onCreateChild: (parentId: number | null) => void;
	onDelete: (id: number) => void;
	isMutating?: boolean;
	className?: string;
};

/**
 * Left-column hierarchical tree of a project's notes. Each row can be
 * expanded/collapsed (if it has children), selected (opens it in the
 * editor), given a child note, or deleted (cascades to its descendants on
 * the backend).
 */
export function NoteTree({
	notes,
	selectedNoteId,
	onSelect,
	onCreateChild,
	onDelete,
	isMutating = false,
	className,
}: NoteTreeProps) {
	const childrenMap = React.useMemo(() => buildNoteChildrenMap(notes), [notes]);
	const rootNotes = getRootNotes(childrenMap);

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

			<div className="flex-1 min-h-0 overflow-y-auto pr-1">
				{rootNotes.length === 0 ? (
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
}: NoteTreeItemProps) {
	const children = getChildNotes(childrenMap, note.id);
	const hasChildren = children.length > 0;
	const isSelected = selectedNoteId === note.id;
	const [open, setOpen] = React.useState(true);

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<div
				className={cn(
					"group flex items-center gap-1 rounded-md px-1 py-1.5 text-xs",
					isSelected
						? "bg-accent/15 text-palm"
						: "text-sea-ink-soft hover:bg-surface-strong/60",
				)}
				style={{ paddingLeft: `${depth * 14 + 4}px` }}
			>
				<CollapsibleTrigger asChild>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setOpen((prev) => !prev);
						}}
						className={cn(
							"shrink-0 p-0.5 rounded hover:bg-surface-strong/80 text-muted-foreground",
							!hasChildren && "invisible",
						)}
					>
						<ChevronRight
							className={cn(
								"h-3 w-3 transition-transform",
								open && "rotate-90",
							)}
						/>
					</button>
				</CollapsibleTrigger>

				<button
					type="button"
					onClick={() => onSelect(note.id)}
					className="flex items-center gap-1 flex-1 min-w-0 text-left cursor-pointer"
				>
					<StickyNote className="h-3 w-3 shrink-0 text-muted-foreground" />
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
						description={`Delete "${getNoteLabel(note)}" and all of its nested notes? This cannot be undone.`}
						confirmText="Delete"
						disabled={isMutating}
						onClick={() => onDelete(note.id)}
					>
						<Trash2 className="h-3 w-3" />
					</ConfirmationButton>
				</div>
			</div>

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
						/>
					))}
				</CollapsibleContent>
			)}
		</Collapsible>
	);
}
