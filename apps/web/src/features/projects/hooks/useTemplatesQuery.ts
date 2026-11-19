import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "#/types/note";

/**
 * Fetches all active template projects (sorted by name). Templates are
 * excluded from the regular project listings and only show up here: on the
 * Templates page and in the "Create from template" picker.
 */
export function useTemplatesQuery({
	enabled = true,
}: {
	enabled?: boolean;
} = {}) {
	return useQuery({
		enabled,
		queryKey: ["projects", "templates"],
		queryFn: async () => {
			const response = await projectControllerFindAll({
				query: {
					limit: 100,
					sortBy: ["name:ASC"],
					"filter.isTemplate": ["$eq:true"],
				},
			});

			const paginated = response.data as PaginatedResponse<ProjectResponseDto>;
			return paginated?.data || [];
		},
	});
}
