import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastApiError } from "#/lib/api-error.ts";
import type { NoteType } from "#/types/note.ts";

export type CreateNoteArgs = {
	/** The note this one should be nested under, if any. `null` creates a root (top-level) note. */
	parentId: number | null;
	type: NoteType;
	/** Optional title of the new note. Defaults to an empty title. */
	title?: string;
	/** Optional initial content (markdown) of the new note. Defaults to empty content. */
	content?: string;
};

/**
 * Creates a new note, optionally nested under a parent and optionally
 * pre-filled with a title and content.
 * Shared by every view that can spawn a note from its notes tree/sidebar
 * (the notes page, the map view, ...), so creation behavior and cache
 * invalidation stay consistent across them.
 */
export function useCreateNote(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			parentId,
			type,
			title = "",
			content = "",
		}: CreateNoteArgs) => {
			const res = await noteControllerCreate({
				path: { projectId },
				body: {
					title,
					content,
					parentIds: parentId !== null ? [parentId] : undefined,
					type,
				},
			});
			return res.data as Note;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
			queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
		},
		onError: toastApiError("create note"),
	});
}
