import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Calendar,
	Compass,
	CornerDownRight,
	Edit2,
	FileText,
	MapPin,
	Plus,
	Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { noteControllerRemove } from "@repo/sdk";
import type { JSX } from "react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import { NoteContentRenderer } from "#/features/notes/components/NoteContentRenderer.tsx";
import { NoteHistorySection } from "#/features/notes/components/NoteHistorySection.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useNoteQuery } from "#/features/notes/hooks/useNoteQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

export const Route = createFileRoute("/projects/$projectId/notes/$id/")({
	component: NoteDetailRouteComponent,
});

function NoteDetailRouteComponent(): JSX.Element {
	const { projectId: projectIdParam, id } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);
	const noteId = parseInt(id, 10);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: note, isLoading } = useNoteQuery(projectId, noteId);
	const { data: availableTags = [] } = useAllTagsQuery(projectId);
	const { data: allNotes = [] } = useAllNotesQuery(projectId);
	const [isCreateChildOpen, setIsCreateChildOpen] = React.useState(false);

	const tagColorMap = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const tag of availableTags) {
			map.set(tag.name.toLowerCase(), tag.color);
		}
		return map;
	}, [availableTags]);

	const removeNoteMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await noteControllerRemove({
				path: { projectId, id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
			queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
			navigate({
				to: "/projects/$projectId/notes",
				params: { projectId: projectIdParam },
			});
		},
		onError: (err) => {
			console.error("Failed to delete note:", err);
			toast.error("Failed to delete note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	if (isLoading) {
		return (
			<div className="min-h-full w-full bg-background/50 p-6 flex flex-col items-center justify-center py-40 font-mono text-xs text-[#00f2ff]">
				<div className="animate-pulse flex flex-col items-center gap-2">
					<span>Loading note details...</span>
				</div>
			</div>
		);
	}

	if (!note) {
		return (
			<div className="min-h-full w-full bg-background/50 p-6 flex flex-col items-center justify-center py-40 gap-4">
				<p className="font-mono text-xs text-red-400">Note #{id} not found.</p>
				<Link
					to="/projects/$projectId/notes"
					params={{ projectId: projectIdParam }}
				>
					<Button
						variant="outline"
						size="sm"
					>
						<ArrowLeft className="h-3 w-3" />
						<span>Back to Notes</span>
					</Button>
				</Link>
			</div>
		);
	}

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

	const parentNote =
		note.parentId !== null && note.parentId !== undefined
			? allNotes.find((n) => n.id === note.parentId)
			: undefined;
	const childNotes = allNotes.filter((n) => n.parentId === note.id);

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
			{/* Breadcrumb Navigation */}
			<div className="flex items-center justify-between border-b border-line pb-4">
				<Link
					to="/projects/$projectId/notes"
					params={{ projectId: projectIdParam }}
				>
					<Button
						variant="outline"
						size="xs"
					>
						<ArrowLeft className="h-3 w-3" />
						<span>BACK TO LIST</span>
					</Button>
				</Link>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="xs"
						onClick={() => setIsCreateChildOpen(true)}
					>
						<Plus className="h-3 w-3" />
						<span>ADD SUB-NOTE</span>
					</Button>
					<Button
						variant="outline"
						size="xs"
						asChild
					>
						<Link
							to="/projects/$projectId/notes/$id/edit"
							params={{ projectId: projectIdParam, id }}
						>
							<Edit2 className="h-3 w-3" />
							<span>EDIT NOTE</span>
						</Link>
					</Button>
					<ConfirmationButton
						variant="outline"
						size="xs"
						onClick={() => removeNoteMutation.mutate(noteId)}
						disabled={removeNoteMutation.isPending}
						title="Delete Note"
						description={`Are you sure you want to permanently delete note #${noteId}?`}
						confirmText="Delete"
					>
						<Trash2 className="h-3 w-3" />
						<span>DELETE NOTE</span>
					</ConfirmationButton>
				</div>
			</div>

			{/* Main Detail Card */}
			<div className="rounded-lg border border-line bg-surface-strong/90 backdrop-blur-md shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
				{/* Header Section */}
				<div className="p-6 border-b border-line pb-5 space-y-4">
					{parentNote && (
						<Link
							to="/projects/$projectId/notes/$id"
							params={{ projectId: projectIdParam, id: String(parentNote.id) }}
							className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground hover:text-palm transition-colors no-underline w-fit"
						>
							<CornerDownRight className="h-3 w-3" />
							<span>
								Nested under: Note #{parentNote.id} —{" "}
								{(parentNote.content || "").slice(0, 40) || "No content"}
							</span>
						</Link>
					)}
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1.5">
							<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-bold font-mono">
								Note Registry
							</span>
							<h1 className="text-2xl font-bold text-sea-ink leading-tight font-mono flex items-center gap-2">
								<span>Note #{note.id}</span>
								<NoteTypeBadge type={note.type} />
							</h1>
						</div>
						{hasCoords && (
							<Link
								to="/projects/$projectId/map"
								params={{ projectId: projectIdParam }}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-palm/10 border border-palm/25 hover:bg-palm/25 text-palm text-xs font-mono font-bold uppercase tracking-wider transition-colors no-underline shadow-[0_0_15px_rgba(0,242,255,0.1)]"
							>
								<Compass className="h-3.5 w-3.5 animate-spin-slow" />
								<span>LOCATE ON MAP</span>
							</Link>
						)}
					</div>

					{/* Metadata Row */}
					<div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 border-t border-line/40">
						<span className="flex items-center gap-1.5">
							<Calendar className="h-4 w-4 text-palm" />
							<span>Created: {formattedDate}</span>
						</span>
						<span className="flex items-center gap-1.5">
							<MapPin className="h-4 w-4 text-palm" />
							{hasCoords ? (
								<span className="font-mono">
									Coordinates: [{note.lat?.toFixed(6)}, {note.lng?.toFixed(6)}]
								</span>
							) : (
								<span className="italic text-muted-foreground/60">
									Non-geolocated note
								</span>
							)}
						</span>
					</div>

					{/* Tag chips */}
					{tags.length > 0 && (
						<div className="flex flex-wrap gap-1.5 pt-1">
							{tags.map((tag) => {
								const displayColor = tagColorMap.get(tag.toLowerCase()) || "#00f2ff";
								return (
									<span
										key={tag}
										className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shadow-sm"
										style={{
											backgroundColor: `${displayColor}12`,
											borderColor: `${displayColor}35`,
											color: displayColor,
										}}
									>
										{tag}
									</span>
								);
							})}
						</div>
					)}
				</div>

				{/* Note Content Panel */}
				<div className="p-6 md:p-8 bg-[#040814]/35 min-h-[300px] flex flex-col gap-6">
					<NoteContentRenderer note={note} />
					{note.type !== "log" && (
						<NoteHistorySection projectId={projectId} noteId={note.id} />
					)}
				</div>

				{/* Sub-notes Section */}
				<div className="border-t border-line p-6 space-y-3">
					<div className="flex items-center justify-between">
						<h2 className="text-xs font-bold uppercase tracking-wider text-sea-ink flex items-center gap-2">
							<FileText className="h-4 w-4 text-palm" />
							<span>
								Sub-notes{" "}
								{childNotes.length > 0 && `(${childNotes.length})`}
							</span>
						</h2>
						<Button
							variant="outline"
							size="xs"
							onClick={() => setIsCreateChildOpen(true)}
						>
							<Plus className="h-3 w-3" />
							<span>Add Sub-note</span>
						</Button>
					</div>
					{childNotes.length === 0 ? (
						<p className="text-xs text-muted-foreground italic">
							This note has no sub-notes yet.
						</p>
					) : (
						<div className="flex flex-col gap-1.5">
							{childNotes.map((child) => (
								<Link
									key={child.id}
									to="/projects/$projectId/notes/$id"
									params={{ projectId: projectIdParam, id: String(child.id) }}
									className="flex items-center gap-2 px-3 py-2 rounded border border-line/50 bg-surface-strong/40 hover:bg-palm/5 hover:border-palm/30 transition-colors no-underline text-inherit"
								>
									<CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
									<span className="font-mono text-xs font-bold text-palm shrink-0">
										#{child.id}
									</span>
									<NoteTypeBadge type={child.type} />
									<span className="text-xs font-sans truncate flex-1">
										{(child.content || "").slice(0, 80) || (
											<span className="italic text-muted-foreground">
												No content
											</span>
										)}
									</span>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>

			{/* Create Sub-note Modal */}
			<CreateNoteModal
				projectId={projectId}
				notes={allNotes}
				defaultParentId={note.id}
				open={isCreateChildOpen}
				onOpenChange={setIsCreateChildOpen}
			/>
		</div>
	);
}
