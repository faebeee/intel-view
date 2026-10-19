import type { PluginResponseDto as Plugin } from "@repo/sdk";
import { pluginControllerFindAll } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the plugins available for a note (filtered server-side by note
 * type), used to render the "Plugins" section of the note details panel.
 */
export function useNotePluginsQuery(
	projectId: number,
	noteId: number | undefined,
) {
	return useQuery({
		queryKey: ["notes", "plugins", projectId, noteId],
		queryFn: async () => {
			const response = await pluginControllerFindAll({
				path: { projectId, noteId: noteId as number },
			});
			return (response.data as Plugin[]) || [];
		},
		enabled: !Number.isNaN(projectId) && noteId !== undefined,
	});
}
