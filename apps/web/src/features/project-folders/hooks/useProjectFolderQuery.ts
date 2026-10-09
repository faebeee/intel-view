import type { ProjectFolderResponseDto } from "@repo/sdk";
import { projectFolderControllerFindOne } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

export function useProjectFolderQuery(id: number) {
	return useQuery({
		queryKey: ["project-folders", id],
		queryFn: async () => {
			const response = await projectFolderControllerFindOne({
				path: { id },
			});
			return response.data as ProjectFolderResponseDto;
		},
		enabled: !Number.isNaN(id),
	});
}
