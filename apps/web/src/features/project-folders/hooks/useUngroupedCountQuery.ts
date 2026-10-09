import { projectFolderControllerUngroupedCount } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Count of active projects not assigned to any folder, used to render the
 * synthetic "Ungrouped" folder card on the dashboard alongside real folders.
 */
export function useUngroupedCountQuery() {
	return useQuery({
		queryKey: ["project-folders", "ungrouped-count"],
		queryFn: async () => {
			const response = await projectFolderControllerUngroupedCount();
			return response.data?.count ?? 0;
		},
	});
}
