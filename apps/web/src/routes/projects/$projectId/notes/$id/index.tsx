import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Compass, Edit2, MapPin, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { noteControllerRemove } from "@repo/sdk";
import type { JSX } from "react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { Markdown } from "#/components/ui/markdown.tsx";
import { EditNoteModal } from "#/features/notes/components/EditNoteModal.tsx";
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

	const { data: note, isLoading, refetch } = useNoteQuery(projectId, noteId);
	const { data: availableTags = [] } = useAllTagsQuery(projectId);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

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
						onClick={() => setIsEditOpen(true)}
					>
						<Edit2 className="h-3 w-3" />
						<span>EDIT NOTE</span>
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
					<div className="flex items-start justify-between gap-4">
						<div className="space-y-1.5">
							<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-bold font-mono">
								Note Registry
							</span>
							<h1 className="text-2xl font-bold text-sea-ink leading-tight font-mono">
								Note #{note.id}
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
				<div className="p-6 md:p-8 bg-[#040814]/35 min-h-[300px]">
					<Markdown content={note.content} />
				</div>
			</div>

			{/* Edit Note Modal */}
			<EditNoteModal
				projectId={projectId}
				note={note}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
				onSuccess={() => refetch()}
			/>
		</div>
	);
}
