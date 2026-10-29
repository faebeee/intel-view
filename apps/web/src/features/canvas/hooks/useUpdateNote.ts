import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type UpdateNotePayload = {
	title?: string;
	content?: string;
	tags?: string[];
	canvasX?: number | null;
	canvasY?: number | null;
};

/**
 * Generic note update mutation used by the canvas view to persist node
 * position (`canvasX`/`canvasY`) and other note fields, without duplicating
 * invalidation/error handling logic across call sites. Parent/child
 * relations are managed separately via the dedicated
 * `useAddNoteParent`/`useRemoveNoteParent`/`useAddNoteChild`/
 * `useRemoveNoteChild` mutations.
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
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
		onError: (err) => {
			console.error("Failed to update note:", err);
			toast.error("Failed to update note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});
}
