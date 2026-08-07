import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NoteType } from "#/features/notes/noteTypes.ts";
import { invalidateNoteQueries } from "#/features/notes/utils/invalidateNoteQueries.ts";
import { toastApiError } from "#/lib/api-error.ts";

export type CreateInlineNotePayload = {
	type: NoteType;
	content: string;
	canvasX: number;
	canvasY: number;
	parentId?: number | null;
};

/**
 * Creates a note directly from the canvas (inline creation), positioned at
 * the given canvas coordinates. Used when a user double-clicks an empty
 * area of the canvas to spawn a new note without leaving the view.
 */
export function useCreateInlineNote(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: CreateInlineNotePayload) => {
			const res = await noteControllerCreate({
				path: { projectId },
				body: payload,
			});
			return res.data as Note;
		},
		onSuccess: () => {
			invalidateNoteQueries(queryClient, projectId);
		},
		onError: toastApiError("add note"),
	});
}
