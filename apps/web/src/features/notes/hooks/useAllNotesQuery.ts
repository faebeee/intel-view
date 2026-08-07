import { useNotesListQuery } from "#/features/notes/hooks/useNotesListQuery.ts";

export function useAllNotesQuery(projectId: number) {
	return useNotesListQuery(projectId, "all");
}
