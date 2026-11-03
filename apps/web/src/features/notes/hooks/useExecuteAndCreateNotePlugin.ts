import type { PluginExecuteResponseDto } from "@repo/sdk";
import { pluginControllerExecuteAndCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastApiError } from "#/lib/api-error.ts";

export type PreviewNotePluginArgs = {
	noteId: number;
	pluginId: string;
};

/**
 * Executes a plugin against a note, returning its generated string result.
 * The result is purely ephemeral — it's returned to the caller for display
 * and never persisted or cached.
 */
export function useExecuteAndCreateNotePlugin(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			noteId,
			pluginId,
		}: PreviewNotePluginArgs): Promise<string> => {
			const res = await pluginControllerExecuteAndCreate({
				path: { projectId, noteId, pluginId },
			});
			return (res.data as PluginExecuteResponseDto).result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
		onError: toastApiError("execute plugin"),
	});
}
