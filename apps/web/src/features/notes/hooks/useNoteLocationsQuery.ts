import type { NoteLocationResponseDto } from "@repo/sdk";
import { noteControllerFindLocations } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the geographic pins derived from a single note — both
 * `[[geo:...]]`-token pins and, for `'address'`-type notes, the synthetic
 * pin derived from its resolved coordinates (see `NoteService.findLocations`
 * on the backend). Mirrors `useAllNoteLocationsQuery`, scoped to one note so
 * consumers like `NoteAddressEditorPane` can render it through the same
 * `AllLocationsMap` component used by the project-wide map view, for
 * identical styling/behavior instead of a bespoke preview.
 */
export function useNoteLocationsQuery(projectId: number, noteId: number) {
	return useQuery({
		queryKey: ["notes", "locations", projectId, noteId],
		queryFn: async () => {
			const response = await noteControllerFindLocations({
				path: { projectId, id: noteId },
			});
			return (response.data as NoteLocationResponseDto[]) || [];
		},
		enabled: !Number.isNaN(projectId) && !Number.isNaN(noteId),
	});
}
