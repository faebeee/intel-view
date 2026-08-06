import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useCanvasNotesQuery(projectId: number) {
	return useQuery({
		queryKey: ["notes", "canvas", projectId],
		queryFn: async () => {
			const response = await noteControllerFindAll({
				path: { projectId },
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
				},
			});

			const paginated = response.data as PaginatedResponse<Note>;
			return paginated?.data || [];
		},
		enabled: !Number.isNaN(projectId),
	});
}
