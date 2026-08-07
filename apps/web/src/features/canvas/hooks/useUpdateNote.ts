import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateNoteQueries } from "#/features/notes/utils/invalidateNoteQueries.ts";
import { toastApiError } from "#/lib/api-error.ts";

export type UpdateNotePayload = {
	content?: string;
	config?: Record<string, unknown> | null;
	lat?: number | null;
	lng?: number | null;
	tags?: string[];
	parentId?: number | null;
	canvasX?: number | null;
	canvasY?: number | null;
};

/**
 * Generic note update mutation used by the canvas view to persist node
 * position (`canvasX`/`canvasY`) and connections (`parentId`) without
 * duplicating invalidation/error handling logic across call sites.
 */
export function useUpdateNote(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			payload,
		}: {
			id: number;
			payload: UpdateNotePayload;
		}) => {
			const res = await noteControllerUpdate({
				path: { projectId, id },
				body: payload,
			});
			return res.data as Note;
		},
		onSuccess: () => {
			invalidateNoteQueries(queryClient, projectId);
		},
		onError: toastApiError("update note"),
	});
}
