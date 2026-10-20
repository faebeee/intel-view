import type { PluginExecuteResponseDto } from "@repo/sdk";
import { pluginControllerPreview } from "@repo/sdk";
import { useMutation } from "@tanstack/react-query";
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
export function usePreviewNotePlugin(projectId: number) {
	return useMutation({
		mutationFn: async ({
			noteId,
			pluginId,
		}: PreviewNotePluginArgs): Promise<string> => {
			const res = await pluginControllerPreview({
				path: { projectId, noteId, pluginId },
			});
			return (res.data as PluginExecuteResponseDto).result;
		},
		onError: toastApiError("run plugin"),
	});
}
