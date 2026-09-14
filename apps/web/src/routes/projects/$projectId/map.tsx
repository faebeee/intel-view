import { createFileRoute } from "@tanstack/react-router";
import { MapPin, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { AllLocationsMap } from "#/features/map/components/AllLocationsMap.tsx";
import type { MapThemeId } from "#/features/map/lib/map-themes.ts";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import { NoteDetailsPanel } from "#/features/notes/components/NoteDetailsPanel.tsx";
import { NoteEditModal } from "#/features/notes/components/NoteEditModal.tsx";
import { NoteTree } from "#/features/notes/components/NoteTree.tsx";
import { useAllNoteLocationsQuery } from "#/features/notes/hooks/useAllNoteLocationsQuery.ts";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useCreateNote } from "#/features/notes/hooks/useCreateNote.ts";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useUpdateProject } from "#/features/projects/hooks/useUpdateProject.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { extractNoteReferenceIds } from "#/lib/note-references.ts";
import type { NoteType } from "#/types/note.ts";

export const Route = createFileRoute("/projects/$projectId/map")({
	component: MapRouteComponent,
});

function MapRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);

	const { data: project, isLoading: isProjectLoading } =
		useProjectQuery(projectId);
	const {
		data: locations = [],
		isLoading: isLocationsLoading,
		isRefetching,
		refetch,
	} = useAllNoteLocationsQuery(projectId);
	const { data: notes = [], refetch: refetchNotes } =
		useAllNotesQuery(projectId);
	const { data: tags = [] } = useAllTagsQuery();

	const updateProjectMutation = useUpdateProject(projectId);
	const handleMapThemeChange = React.useCallback(
		(theme: MapThemeId) => {
			updateProjectMutation.mutate({ mapTheme: theme });
		},
		[updateProjectMutation],
	);

	const [selectedNoteId, setSelectedNoteId] = React.useState<number | null>(
		null,
	);

	const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

	/** The set of note ids matching the sidebar's search box, or `null` while the search is empty (no filter active). Narrows the map's visible pins alongside the selected-note connectivity filter below. */
	const [searchMatchedNoteIds, setSearchMatchedNoteIds] =
		React.useState<Set<number> | null>(null);

	const handleSelectNote = React.useCallback((noteId: number) => {
		setSelectedNoteId((current) => (current === noteId ? null : noteId));
	}, []);

	const selectedNote = React.useMemo(
		() => notes.find((note) => note.id === selectedNoteId) ?? null,
		[notes, selectedNoteId],
	);

	// --- New note dialog -----------------------------------------------------

	const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
	const [createDialogParentId, setCreateDialogParentId] = React.useState<
		number | null
	>(null);

	const openCreateDialog = React.useCallback((parentId: number | null) => {
		setCreateDialogParentId(parentId);
		setIsCreateDialogOpen(true);
	}, []);

	const createNoteMutation = useCreateNote(projectId);
	const handleCreateNote = (type: NoteType) => {
		createNoteMutation.mutate(
			{ parentId: createDialogParentId, type },
			{
				onSuccess: (note) => {
					setSelectedNoteId(note.id);
					setIsCreateDialogOpen(false);
				},
			},
		);
	};

	const deleteNoteMutation = useDeleteNote(projectId);
	const handleDeleteNote = React.useCallback(
		(id: number) => {
			deleteNoteMutation.mutate(id, {
				onSuccess: () => {
					setSelectedNoteId((current) => (current === id ? null : current));
				},
			});
		},
		[deleteNoteMutation],
	);

	/**
	 * Adjacency list of every note's directly connected notes — parents,
	 * children, notes it references via `[[NOTE_ID]]`, and notes that
	 * reference it back — used to walk the *entire* connected component of
	 * the selected note (not just its direct neighbors), e.g. a
	 * grandparent, a child's child, or a note reached transitively through
	 * a chain of `[[NOTE_ID]]` references.
	 */
	const connectionsByNoteId = React.useMemo(() => {
		const adjacency = new Map<number, Set<number>>();
		const link = (a: number, b: number) => {
			if (a === b) return;
			if (!adjacency.has(a)) adjacency.set(a, new Set());
			if (!adjacency.has(b)) adjacency.set(b, new Set());
			adjacency.get(a)?.add(b);
			adjacency.get(b)?.add(a);
		};
		for (const note of notes) {
			for (const parentId of note.parentIds ?? []) {
				link(note.id, parentId);
			}
			for (const childId of note.childIds ?? []) {
				link(note.id, childId);
			}
			for (const referencedId of extractNoteReferenceIds(note.content)) {
				link(note.id, referencedId);
			}
		}
		return adjacency;
	}, [notes]);

	/**
	 * Locations shown on the map: everything when nothing's selected and no
	 * search is active, or narrowed by whichever of those two filters are
	 * active. When a note is selected, only pins belonging to it and every
	 * note *recursively* connected to it (its whole connected component,
	 * following parent, child, and `[[NOTE_ID]]` reference links in any
	 * direction and any number of hops) are eligible. When the sidebar
	 * search box has a query, only pins for matching notes are eligible.
	 * Both filters apply together when both are active (i.e. intersected).
	 */
	const visibleLocations = React.useMemo(() => {
		let result = locations;

		if (selectedNoteId !== null) {
			const relevantNoteIds = new Set<number>([selectedNoteId]);
			const queue: number[] = [selectedNoteId];
			while (queue.length > 0) {
				const currentId = queue.pop();
				if (currentId === undefined) continue;
				for (const neighborId of connectionsByNoteId.get(currentId) ?? []) {
					if (relevantNoteIds.has(neighborId)) continue;
					relevantNoteIds.add(neighborId);
					queue.push(neighborId);
				}
			}
			result = result.filter((location) =>
				relevantNoteIds.has(location.noteId),
			);
		}

		if (searchMatchedNoteIds !== null) {
			result = result.filter((location) =>
				searchMatchedNoteIds.has(location.noteId),
			);
		}

		return result;
	}, [locations, selectedNoteId, connectionsByNoteId, searchMatchedNoteIds]);

	/** Whether an active search yielded no map pins at all, driving the "no results" overlay message (distinct from the selected-note-has-no-locations message below). */
	const searchHasNoResults =
		searchMatchedNoteIds !== null && visibleLocations.length === 0;

	/** Whether the *selected* note itself (ignoring any parent pins tagged along) has no locations, driving the "no locations" overlay message. Suppressed while the search-empty message is already showing to avoid double overlays. */
	const selectedNoteHasNoLocations =
		!searchHasNoResults &&
		selectedNoteId !== null &&
		!locations.some((location) => location.noteId === selectedNoteId);

	if (isProjectLoading) {
		return <LoadingState label="Loading project..." />;
	}

	if (!project) {
		return (
			<NotFoundState
				message={`Project #${projectIdParam} not found.`}
				backTo="/"
				backLabel="Back to Projects"
			/>
		);
	}

	return (
		<div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-background/50 animate-fade-in">
			<div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 shrink-0">
				<div className="flex items-center gap-2">
					<MapPin className="h-5 w-5 text-palm" />
					<h1 className="text-lg font-bold text-sea-ink uppercase tracking-wider">
						Map
					</h1>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							refetch();
							refetchNotes();
						}}
						disabled={isLocationsLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isLocationsLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLocationsLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 flex">
				<NoteTree
					notes={notes}
					tags={tags}
					locations={locations}
					selectedNoteId={selectedNote?.id}
					onSelect={handleSelectNote}
					onCreateChild={openCreateDialog}
					onDelete={handleDeleteNote}
					onVisibleNoteIdsChange={setSearchMatchedNoteIds}
					isMutating={
						createNoteMutation.isPending || deleteNoteMutation.isPending
					}
					className="w-80 shrink-0 border-r border-line p-3"
				/>

				<div className="flex-1 min-w-0 relative">
					{isLocationsLoading ? (
						<LoadingState label="Loading locations..." compact />
					) : (
						<>
						<AllLocationsMap
							projectId={projectIdParam}
							locations={visibleLocations}
							notes={notes}
							selectedNoteId={selectedNoteId}
							onNoteSelect={handleSelectNote}
							onNoteDoubleClick={(noteId) => {
								setSelectedNoteId(noteId);
								setIsEditModalOpen(true);
							}}
							mapTheme={project.mapTheme}
							onMapThemeChange={handleMapThemeChange}
							className="h-full w-full"
						/>
							{locations.length === 0 && (
								<div className="absolute inset-x-0 top-4 flex justify-center px-4 pointer-events-none">
									<div className="pointer-events-auto flex items-center gap-2 rounded-md border border-line bg-surface-strong/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
										<MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
										No locations yet — insert one from a note's editor using the
										map pin toolbar button.
									</div>
								</div>
							)}
							{selectedNoteHasNoLocations && (
								<div className="absolute inset-x-0 top-4 flex justify-center px-4 pointer-events-none">
									<div className="pointer-events-auto rounded-md border border-line bg-surface-strong/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
										This note doesn't have any locations on the map.
									</div>
								</div>
							)}
							{searchHasNoResults && (
								<div className="absolute inset-x-0 top-4 flex justify-center px-4 pointer-events-none">
									<div className="pointer-events-auto rounded-md border border-line bg-surface-strong/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
										No pins match your search.
									</div>
								</div>
							)}
						</>
					)}
				</div>

			{selectedNote && (
				<NoteDetailsPanel
					projectId={projectId}
					projectIdParam={projectIdParam}
					note={selectedNote}
					notes={notes}
					onEdit={() => setIsEditModalOpen(true)}
					onDeleted={() => setSelectedNoteId(null)}
					className="w-80 shrink-0 border-l border-line"
				/>
			)}
			</div>

			<CreateNoteModal
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onCreate={handleCreateNote}
				isCreating={createNoteMutation.isPending}
			/>

			<NoteEditModal
				projectId={projectId}
				note={selectedNote}
				notes={notes}
				tags={tags}
				open={isEditModalOpen && !!selectedNote}
				onOpenChange={setIsEditModalOpen}
				onDeleted={() => {
					setIsEditModalOpen(false);
					setSelectedNoteId(null);
				}}
			/>
		</div>
	);
}
