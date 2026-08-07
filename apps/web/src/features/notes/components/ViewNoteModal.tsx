import type { NoteResponseDto as Note } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import { Calendar, Edit2, MapPin } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { NoteContentRenderer } from "#/features/notes/components/NoteContentRenderer.tsx";
import { NoteHistorySection } from "#/features/notes/components/NoteHistorySection.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";

type ViewNoteModalProps = {
	projectId: number;
	projectIdParam: string;
	note: Note | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ViewNoteModal({
	projectId,
	projectIdParam,
	note,
	open,
	onOpenChange,
}: ViewNoteModalProps) {
	const { data: availableTags = [] } = useAllTagsQuery(projectId);
	const tagColorMap = useTagColorMap(availableTags);

	if (!note) return null;

	const hasCoords =
		note.lat !== null &&
		note.lat !== undefined &&
		note.lng !== null &&
		note.lng !== undefined;

	const formattedDate = new Date(note.createdAt).toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	const tags = note.tags || [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-2xl shadow-2xl shadow-black/80 max-h-[85vh] flex flex-col p-0">
				{/* Modal Header */}
				<DialogHeader className="p-6 border-b border-line pb-4 shrink-0 space-y-2">
					<div className="flex items-center justify-between gap-4">
						<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono flex items-center gap-2">
							<span>Note #{note.id}</span>
							<NoteTypeBadge type={note.type} />
						</DialogTitle>
						<Button variant="outline" size="xs" asChild>
							<Link
								to="/projects/$projectId/notes/$id/edit"
								params={{ projectId: projectIdParam, id: String(note.id) }}
								onClick={() => onOpenChange(false)}
							>
								<Edit2 className="h-3 w-3" />
								<span>Edit Note</span>
							</Link>
						</Button>
					</div>
					<DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
						<span className="flex items-center gap-1">
							<Calendar className="h-3.5 w-3.5 text-palm" />
							<span>Created: {formattedDate}</span>
						</span>
						<span className="flex items-center gap-1">
							<MapPin className="h-3.5 w-3.5 text-palm" />
							{hasCoords ? (
								<span className="font-mono">
									Coordinates: [{note.lat?.toFixed(5)}, {note.lng?.toFixed(5)}]
								</span>
							) : (
								<span className="italic">Non-geolocated note</span>
							)}
						</span>
						{note.parentId !== null && note.parentId !== undefined && (
							<span className="flex items-center gap-1 font-mono">
								<span>Parent: #{note.parentId}</span>
							</span>
						)}
					</DialogDescription>

					{/* Tag Chips in Header */}
					<TagChipList
						tags={tags}
						tagColorMap={tagColorMap}
						size="sm"
						className="pt-1"
					/>
				</DialogHeader>

				{/* Modal Body / Markdown Content */}
				<div className="flex-1 overflow-y-auto p-6 min-h-0 bg-[#040814]/30 space-y-4">
					<NoteContentRenderer note={note} />
					{note.type !== "log" && (
						<NoteHistorySection projectId={projectId} noteId={note.id} />
					)}
				</div>

				{/* Modal Footer */}
				<DialogFooter className="p-4 border-t border-line shrink-0 bg-surface-strong/40">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
