import type { NoteHistoryEntryResponseDto } from "@repo/sdk";
import { noteControllerAddManualEntry } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Adds a freeform 'manual' history entry to a `log` note, from the note
 * detail view. Only supported for notes of type `log` — the backend
 * rejects manual entries on any other note type.
 */
export function useAddManualHistoryEntry(projectId: number, noteId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (content: string) => {
			const res = await noteControllerAddManualEntry({
				path: { projectId, id: noteId },
				body: { content },
			});
			return res.data as NoteHistoryEntryResponseDto;
		},
		onSuccess: () => {
			toast.success("History entry added");
			queryClient.invalidateQueries({
				queryKey: ["notes", projectId, noteId, "history"],
			});
		},
		onError: (err) => {
			console.error("Failed to add history entry:", err);
			toast.error("Failed to add history entry", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});
}
