import { noteControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateNoteQueries } from "#/features/notes/utils/invalidateNoteQueries.ts";
import { toastApiError } from "#/lib/api-error.ts";

/** Deletes a note from the canvas (soft delete), matching the notes tree view convention. */
export function useDeleteNote(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: number) => {
			const res = await noteControllerRemove({
				path: { projectId, id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note deleted successfully");
			invalidateNoteQueries(queryClient, projectId);
		},
		onError: toastApiError("delete note"),
	});
}
