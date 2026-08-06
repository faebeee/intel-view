import { noteControllerRemove } from "@repo/sdk";
import type { NoteResponseDto as Note } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import { NoteTreeView } from "#/features/notes/components/NoteTreeView.tsx";
import { ViewNoteModal } from "#/features/notes/components/ViewNoteModal.tsx";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";

export const Route = createFileRoute("/projects/$projectId/notes/")({
	component: NotesRouteComponent,
});

function NotesRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);
	const queryClient = useQueryClient();
	const {
		data: notes = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllNotesQuery(projectId);
	const { data: availableTags = [] } = useAllTagsQuery(projectId);

	const tagColorMap = React.useMemo(() => {
		const map = new Map<string, string>();
		for (const tag of availableTags) {
			map.set(tag.name.toLowerCase(), tag.color);
		}
		return map;
	}, [availableTags]);
	const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
	const [isViewOpen, setIsViewOpen] = React.useState(false);

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [createParentId, setCreateParentId] = React.useState<number | null>(
		null,
	);

	const [pendingDeleteIds, setPendingDeleteIds] = React.useState<Set<number>>(
		new Set(),
	);

	const removeNoteMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await noteControllerRemove({
				path: { projectId, id },
			});
			return res.data;
		},
		onMutate: (id: number) => {
			setPendingDeleteIds((prev) => new Set(prev).add(id));
		},
		onSuccess: () => {
			toast.success("Note deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
			queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
		},
		onError: (err) => {
			console.error("Failed to delete note:", err);
			toast.error("Failed to delete note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
		onSettled: (_data, _err, id) => {
			setPendingDeleteIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		},
	});

	const handleViewClick = (note: Note) => {
		setViewingNote(note);
		setIsViewOpen(true);
	};

	const handleAddChildClick = (note: Note) => {
		setCreateParentId(note.id);
		setIsCreateOpen(true);
	};

	const handleAddRootClick = () => {
		setCreateParentId(null);
		setIsCreateOpen(true);
	};

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-palm" />
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							Notes
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Search and manage nested, geolocated notes.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>

					<Button
						variant="default"
						size="sm"
						onClick={handleAddRootClick}
					>
						<Plus className="h-4 w-4" />
						<span>Add Note</span>
					</Button>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-xs text-[#00f2ff]">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>Loading notes...</span>
					</div>
				</div>
			) : (
				<div className="flex-1">
					<NoteTreeView
						notes={notes}
						projectIdParam={projectIdParam}
						tagColorMap={tagColorMap}
						onView={handleViewClick}
						onAddChild={handleAddChildClick}
						onDelete={(note) => removeNoteMutation.mutate(note.id)}
						isDeletePending={(id) => pendingDeleteIds.has(id)}
					/>
				</div>
			)}

			{/* View Note Modal */}
			<ViewNoteModal
				projectId={projectId}
				projectIdParam={projectIdParam}
				note={viewingNote}
				open={isViewOpen}
				onOpenChange={setIsViewOpen}
			/>

			{/* Create Note Modal */}
			<CreateNoteModal
				projectId={projectId}
				notes={notes}
				defaultParentId={createParentId}
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
