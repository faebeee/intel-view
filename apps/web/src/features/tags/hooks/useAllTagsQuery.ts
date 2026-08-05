import type { Tag } from "@repo/sdk";
import { tagControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllTagsQuery() {
	return useQuery({
		queryKey: ["tags", "all"],
		queryFn: async () => {
			const response = await tagControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
				},
			});

			const paginated = response.data as PaginatedResponse<Tag>;
			return paginated?.data || [];
		},
	});
}
