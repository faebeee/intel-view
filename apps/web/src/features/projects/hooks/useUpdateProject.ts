import type { ProjectResponseDto, UpdateProjectDto } from "@repo/sdk";
import { projectControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastApiError } from "#/lib/api-error.ts";

export function useUpdateProject(id: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: UpdateProjectDto) => {
			const response = await projectControllerUpdate({
				path: { id },
				body: payload,
			});
			return response.data as ProjectResponseDto;
		},
		onSuccess: (project) => {
			queryClient.setQueryData(["projects", id], project);
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
		},
		onError: toastApiError("update project"),
	});
}
