import { Link } from "@tanstack/react-router";
import { Edit2, FileQuestion } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";
import { useNoteQuery } from "#/features/notes/hooks/useNoteQuery";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap";
import { NoteContentRenderer } from "./NoteContentRenderer";
import { NoteHistorySection } from "./NoteHistorySection";
import { NoteTypeBadge } from "./NoteTypeBadge";

/**
 * Global overlay sidebar shown when the user clicks a `[[NOTE_ID]]`
 * reference chip anywhere markdown is rendered (note detail views, the
 * notes list, the markdown editor's preview pane, canvas/map views, etc.).
 * Unlike `NoteDetailPanel` (a squeeze panel used only by the canvas/map
 * views), this is a `Sheet` overlay so it works consistently regardless of
 * the surrounding layout, including from inside other dialogs/modals.
 *
 * Mounted once per project alongside `NoteReferenceProvider` at the
 * `/projects/$projectId` layout route.
 */
export function NoteReferenceSheet() {
	const { projectId, openNoteId, closeNoteReference, openNoteReference } =
		useNoteReference();
	const open = openNoteId !== null;

	const {
		data: note,
		isLoading,
		isError,
	} = useNoteQuery(projectId, openNoteId ?? Number.NaN);
	const { data: availableTags = [] } = useAllTagsQuery(projectId);
	const tagColorMap = useTagColorMap(availableTags);

	const projectIdParam = String(projectId);
	const notFound = !isLoading && (isError || !note);

	return (
		<Sheet
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) closeNoteReference();
			}}
		>
			<SheetContent side="right" className="w-full sm:max-w-md gap-0 p-0">
				<SheetHeader className="border-b border-line flex-row items-start justify-between gap-2 space-y-0">
					<div className="space-y-0.5">
						<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-bold font-mono">
							Note Reference
						</span>
						<SheetTitle className="flex items-center gap-2 font-mono font-semibold text-sea-ink text-sm">
							<span>Note #{openNoteId}</span>
							{note && <NoteTypeBadge type={note.type} />}
						</SheetTitle>
					</div>
				</SheetHeader>

				{isLoading ? (
					<div className="flex-1 flex items-center justify-center py-40 font-mono text-xs text-[#00f2ff]">
						<div className="animate-pulse">Loading note details...</div>
					</div>
				) : notFound ? (
					<div className="flex-1 flex flex-col items-center justify-center gap-2 py-40 text-center text-muted-foreground px-6">
						<FileQuestion className="h-6 w-6 opacity-40" />
						<p className="text-xs italic">
							Note #{openNoteId} was not found in this project. It may have
							been deleted, or the reference id may be incorrect.
						</p>
					</div>
				) : note ? (
					<>
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							<TagChipList
								tags={note.tags || []}
								tagColorMap={tagColorMap}
								size="sm"
							/>
							<div className="rounded-lg border border-line bg-[#040814]/35 p-4 space-y-4">
								<NoteContentRenderer note={note} />
							</div>
							{note.type !== "log" && (
								<NoteHistorySection projectId={projectId} noteId={note.id} />
							)}
						</div>

						<div className="border-t border-line p-4 flex gap-2 shrink-0">
							{note.parentId !== null && note.parentId !== undefined && (
								<Button
									variant="outline"
									size="xs"
									className="flex-1"
									onClick={() => openNoteReference(note.parentId as number)}
								>
									<span>Parent: #{note.parentId}</span>
								</Button>
							)}
							<Link
								to="/projects/$projectId/notes/$id/edit"
								params={{ projectId: projectIdParam, id: String(note.id) }}
								className="flex-1"
								onClick={closeNoteReference}
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
								onClick={closeNoteReference}
							>
								<Button variant="outline" size="xs" className="w-full">
									<span>Full Page</span>
								</Button>
							</Link>
						</div>
					</>
				) : null}
			</SheetContent>
		</Sheet>
	);
}

export default NoteReferenceSheet;
