import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

/**
 * Fetches every active note in a project for the canvas view. Mirrors
 * `useAllNotesQuery` but under its own query key so canvas-specific
 * mutations (position drags, reparenting) can invalidate independently of
 * the notes list/tree views.
 */
export function useCanvasNotesQuery(projectId: number) {
	return useQuery({
		queryKey: ["notes", "canvas", projectId],
		queryFn: async () => {
			const response = await noteControllerFindAll({
				path: { projectId },
				query: {
					limit: 1000,
					sortBy: ["id:ASC"],
				},
			});

			const paginated = response.data as PaginatedResponse<Note>;
			return paginated?.data || [];
		},
		enabled: !Number.isNaN(projectId),
	});
}
