import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidates every cached notes list/detail query affected by a note
 * create/update/delete for a project, so all views showing notes (notes
 * list/tree, and — if `noteId` is given — the note's own detail query)
 * refetch fresh data.
 */
export function invalidateNoteQueries(
	queryClient: QueryClient,
	projectId: number,
	noteId?: number,
): void {
	queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
	if (noteId !== undefined) {
		queryClient.invalidateQueries({ queryKey: ["notes", projectId, noteId] });
	}
}
