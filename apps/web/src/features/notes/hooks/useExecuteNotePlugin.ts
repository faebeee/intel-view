import type { PluginExecuteResponseDto } from "@repo/sdk";
import { pluginControllerExecute } from "@repo/sdk";
import { useMutation } from "@tanstack/react-query";
import { toastApiError } from "#/lib/api-error.ts";

export type ExecuteNotePluginArgs = {
	noteId: number;
	pluginId: string;
};

/**
 * Executes a plugin against a note, returning its generated string result.
 * The result is purely ephemeral — it's returned to the caller for display
 * and never persisted or cached.
 */
export function useExecuteNotePlugin(projectId: number) {
	return useMutation({
		mutationFn: async ({
			noteId,
			pluginId,
		}: ExecuteNotePluginArgs): Promise<string> => {
			const res = await pluginControllerExecute({
				path: { projectId, noteId, pluginId },
			});
			return (res.data as PluginExecuteResponseDto).result;
		},
		onError: toastApiError("run plugin"),
	});
}
