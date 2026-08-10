import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

/**
 * Fetches every active note in a project (uncapped-ish, high `limit`), used
 * to build the notes tree/sidebar and the parent-note picker. Mirrors
 * `useAllTagsQuery`.
 */
export function useAllNotesQuery(projectId: number) {
	return useQuery({
		queryKey: ["notes", "all", projectId],
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
