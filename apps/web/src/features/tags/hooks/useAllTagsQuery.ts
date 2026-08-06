import type { TagResponseDto as Tag } from "@repo/sdk";
import { tagControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllTagsQuery(projectId: number) {
	return useQuery({
		queryKey: ["tags", "all", projectId],
		queryFn: async () => {
			const response = await tagControllerFindAll({
				path: { projectId },
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
				},
			});

			const paginated = response.data as PaginatedResponse<Tag>;
			return paginated?.data || [];
		},
		enabled: !Number.isNaN(projectId),
	});
}
