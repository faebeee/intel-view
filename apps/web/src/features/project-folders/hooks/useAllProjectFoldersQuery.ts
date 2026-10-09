import type { ProjectFolderResponseDto } from "@repo/sdk";
import { projectFolderControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

export function useAllProjectFoldersQuery() {
	return useQuery({
		queryKey: ["project-folders", "all"],
		queryFn: async () => {
			const response = await projectFolderControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["name:ASC"],
				},
			});

			const paginated =
				response.data as PaginatedResponse<ProjectFolderResponseDto>;
			return paginated?.data || [];
		},
	});
}
