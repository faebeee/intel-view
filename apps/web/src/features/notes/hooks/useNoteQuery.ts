import type { Note } from "@repo/sdk";
import { noteControllerFindOne } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

export function useNoteQuery(id: number) {
	return useQuery({
		queryKey: ["notes", id],
		queryFn: async () => {
			const response = await noteControllerFindOne({
				path: { id },
			});
			return response.data as Note;
		},
		enabled: !isNaN(id),
	});
}
