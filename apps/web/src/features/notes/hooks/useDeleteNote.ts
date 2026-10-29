import { noteControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
		onError: (err) => {
			console.error("Failed to delete note:", err);
			toast.error("Failed to delete note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});
}
