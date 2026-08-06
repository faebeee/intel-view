import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllProjectsQuery() {
	return useQuery({
		queryKey: ["projects", "all"],
		queryFn: async () => {
			const response = await projectControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
				},
			});

			const paginated = response.data as PaginatedResponse<ProjectResponseDto>;
			return paginated?.data || [];
		},
	});
}
