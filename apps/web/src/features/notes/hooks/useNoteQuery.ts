import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerFindOne } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

export function useNoteQuery(projectId: number, id: number) {
	return useQuery({
		queryKey: ["notes", projectId, id],
		queryFn: async () => {
			const response = await noteControllerFindOne({
				path: { projectId, id },
			});
			return response.data as Note;
		},
		enabled: !Number.isNaN(projectId) && !Number.isNaN(id),
	});
}
