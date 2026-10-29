import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { NoteType } from "#/types/note.ts";

export type CreateInlineNotePayload = {
	type: NoteType;
	canvasX: number;
	canvasY: number;
	parentIds?: number[];
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
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
		onError: (err) => {
			console.error("Failed to create note:", err);
			toast.error("Failed to add note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});
}
