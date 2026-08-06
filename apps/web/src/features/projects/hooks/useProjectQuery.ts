import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerFindOne } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

export function useProjectQuery(id: number) {
	return useQuery({
		queryKey: ["projects", id],
		queryFn: async () => {
			const response = await projectControllerFindOne({
				path: { id },
			});
			return response.data as ProjectResponseDto;
		},
		enabled: !Number.isNaN(id),
	});
}
