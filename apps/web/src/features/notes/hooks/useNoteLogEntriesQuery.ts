import type { NoteLogEntryResponseDto as NoteLogEntry } from "@repo/sdk";
import { noteControllerFindLogEntries } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches every log entry recorded for a `'log'`-type note, most recent
 * first. Mirrors `useNoteHistoryQuery`.
 */
export function useNoteLogEntriesQuery(
	projectId: number,
	noteId: number | undefined,
) {
	return useQuery({
		queryKey: ["notes", "log-entries", projectId, noteId],
		queryFn: async () => {
			const response = await noteControllerFindLogEntries({
				path: { projectId, id: noteId as number },
			});
			return (response.data as NoteLogEntry[]) || [];
		},
		enabled: !Number.isNaN(projectId) && noteId !== undefined,
	});
}
