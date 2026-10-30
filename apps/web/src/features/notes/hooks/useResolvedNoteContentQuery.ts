import { noteControllerFindResolvedContent } from "@repo/sdk";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches a note's content with every `[[NOTE_ID]]` transclusion reference
 * recursively replaced by the referenced note's own resolved content (see
 * `NoteService.resolveContent` on the API). Used wherever a note's content
 * is rendered read-only (e.g. `NoteDetailsPanel`), so embedded notes show
 * up inline instead of as a raw `[[ID]]` reference.
 */
export function useResolvedNoteContentQuery(
	projectId: number,
	noteId: number | undefined,
) {
	return useQuery({
		queryKey: ["notes", "resolved-content", projectId, noteId],
		queryFn: async () => {
			const response = await noteControllerFindResolvedContent({
				path: { projectId, id: noteId as number },
			});
			return response.data?.content ?? "";
		},
		enabled: !Number.isNaN(projectId) && noteId !== undefined,
	});
}
