import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

/**
 * Shared implementation backing `useAllNotesQuery` and `useCanvasNotesQuery`
 * (identical fetch logic, differing only by cache-key segment so each view
 * can be invalidated independently).
 */
export function useNotesListQuery(projectId: number, cacheKeySegment: string) {
	return useQuery({
		queryKey: ["notes", cacheKeySegment, projectId],
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
