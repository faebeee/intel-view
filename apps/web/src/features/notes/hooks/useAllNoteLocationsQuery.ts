import type { NoteLocationResponseDto } from "@repo/sdk";
import { noteControllerFindAllLocations } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches every geographic pin derived from every active note's content
 * across a project (each already enriched with its owning note's display
 * label server-side). Powers the project-wide map view. Mirrors
 * `useAllNotesQuery`.
 */
export function useAllNoteLocationsQuery(projectId: number) {
	return useQuery({
		queryKey: ["notes", "locations", "all", projectId],
		queryFn: async () => {
			const response = await noteControllerFindAllLocations({
				path: { projectId },
			});
			return (response.data as NoteLocationResponseDto[]) || [];
		},
		enabled: !Number.isNaN(projectId),
	});
}
