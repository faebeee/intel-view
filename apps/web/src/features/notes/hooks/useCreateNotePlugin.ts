import { pluginControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastApiError } from "#/lib/api-error.ts";

export type CreateNotePluginArgs = {
	noteId: number;
	pluginId: string;
};

/**
 * Creates a new child note from a plugin's preview result.
 * This is used for non-executable plugins.
 */
export function useCreateNotePlugin(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			noteId,
			pluginId,
		}: CreateNotePluginArgs): Promise<void> => {
			await pluginControllerCreate({
				path: { projectId, noteId, pluginId },
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
		onError: toastApiError("create note from plugin"),
	});
}
