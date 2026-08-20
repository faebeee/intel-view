import { createFileRoute } from "@tanstack/react-router";
import { MapPin, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { AllLocationsMap } from "#/features/map/components/AllLocationsMap.tsx";
import { NoteDetailsPanel } from "#/features/map/components/NoteDetailsPanel.tsx";
import { NotesMapSidebar } from "#/features/map/components/NotesMapSidebar.tsx";
import { useAllNoteLocationsQuery } from "#/features/notes/hooks/useAllNoteLocationsQuery.ts";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useUpdateProject } from "#/features/projects/hooks/useUpdateProject.ts";
import type { MapThemeId } from "#/features/map/lib/map-themes.ts";

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

	const handleSelectNote = React.useCallback((noteId: number) => {
		setSelectedNoteId((current) => (current === noteId ? null : noteId));
	}, []);

	const selectedNote = React.useMemo(
		() => notes.find((note) => note.id === selectedNoteId) ?? null,
		[notes, selectedNoteId],
	);

	/**
	 * Locations shown on the map: everything when nothing's selected, or
	 * just the selected note's own pins plus its parent notes' pins (if any)
	 * when one is focused — so a note and the parent(s) it's linked under
	 * (and the connecting lines drawn between them) are all visible together.
	 */
	const visibleLocations = React.useMemo(() => {
		if (selectedNoteId === null) return locations;
		const relevantNoteIds = new Set<number>([selectedNoteId]);
		for (const parentId of selectedNote?.parentIds ?? []) {
			relevantNoteIds.add(parentId);
		}
		return locations.filter((location) => relevantNoteIds.has(location.noteId));
	}, [locations, selectedNoteId, selectedNote]);

	/** Whether the *selected* note itself (ignoring any parent pins tagged along) has no locations, driving the "no locations" overlay message. */
	const selectedNoteHasNoLocations =
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
				<NotesMapSidebar
					projectId={projectId}
					notes={notes}
					locations={locations}
					selectedNoteId={selectedNoteId}
					onSelectNote={handleSelectNote}
					className="w-80 shrink-0 border-r border-line"
				/>

				<div className="flex-1 min-w-0 relative">
					{isLocationsLoading ? (
						<LoadingState label="Loading locations..." compact />
					) : locations.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
							<MapPin className="h-8 w-8 text-muted-foreground/40" />
							<p className="text-sm text-muted-foreground">
								No locations yet — insert one from a note's editor using the map
								pin toolbar button.
							</p>
						</div>
					) : (
						<>
							<AllLocationsMap
								projectId={projectIdParam}
								locations={visibleLocations}
								notes={notes}
								selectedNoteId={selectedNoteId}
								onNoteSelect={handleSelectNote}
								mapTheme={project.mapTheme}
								onMapThemeChange={handleMapThemeChange}
								className="h-full w-full"
							/>
							{selectedNoteHasNoLocations && (
								<div className="absolute inset-x-0 top-4 flex justify-center px-4 pointer-events-none">
									<div className="pointer-events-auto rounded-md border border-line bg-surface-strong/95 px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
										This note doesn't have any locations on the map.
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
						className="w-80 shrink-0 border-l border-line"
					/>
				)}
			</div>
		</div>
	);
}
