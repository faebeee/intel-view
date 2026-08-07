import { useNotesListQuery } from "#/features/notes/hooks/useNotesListQuery.ts";

export function useCanvasNotesQuery(projectId: number) {
	return useNotesListQuery(projectId, "canvas");
}
