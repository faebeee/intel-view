import type { ProjectGroupResponseDto } from "@repo/sdk";
import { projectGroupControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllProjectGroupsQuery() {
	return useQuery({
		queryKey: ["project-groups", "all"],
		queryFn: async () => {
			const response = await projectGroupControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["name:ASC"],
				},
			});

			const paginated =
				response.data as PaginatedResponse<ProjectGroupResponseDto>;
			return paginated?.data || [];
		},
	});
}
