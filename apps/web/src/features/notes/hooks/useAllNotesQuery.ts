import type { Note } from "@repo/sdk";
import { noteControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllNotesQuery() {
	return useQuery({
		queryKey: ["notes", "all"],
		queryFn: async () => {
			const response = await noteControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
				},
			});

			const paginated = response.data as PaginatedResponse<Note>;
			return paginated?.data || [];
		},
	});
}
