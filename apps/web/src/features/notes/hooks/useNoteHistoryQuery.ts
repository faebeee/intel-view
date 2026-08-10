import type { NoteHistoryEntryResponseDto as NoteHistoryEntry } from "@repo/sdk";
import { noteControllerFindHistory } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches the full automatic change history (most recent first) of a note,
 * used by the "History" section of the note settings panel.
 */
export function useNoteHistoryQuery(
	projectId: number,
	noteId: number | undefined,
) {
	return useQuery({
		queryKey: ["notes", "history", projectId, noteId],
		queryFn: async () => {
			const response = await noteControllerFindHistory({
				path: { projectId, id: noteId as number },
			});
			return (response.data as NoteHistoryEntry[]) || [];
		},
		enabled: !Number.isNaN(projectId) && noteId !== undefined,
	});
}
