import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

/**
 * Fetches active projects scoped to a single folder, or the "ungrouped"
 * pseudo-folder (projects with no `folderId`) when `folderId` is `null`.
 * Backs both the real-folder and synthetic "Ungrouped" dashboard routes.
 */
export function useProjectsByFolderQuery(folderId: number | null) {
	return useQuery({
		queryKey: ["projects", "by-folder", folderId],
		queryFn: async () => {
			const response = await projectControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["id:DESC"],
					"filter.folderId": [folderId == null ? "$null" : String(folderId)],
				},
			});

			const paginated = response.data as PaginatedResponse<ProjectResponseDto>;
			return paginated?.data || [];
		},
	});
}
