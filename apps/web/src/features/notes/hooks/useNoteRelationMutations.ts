import type { NoteResponseDto as Note } from "@repo/sdk";
import {
	noteControllerAddChild,
	noteControllerAddParent,
	noteControllerRemoveChild,
	noteControllerRemoveParent,
} from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Shared invalidation for any mutation that changes a note's parent/child
 * relations — refreshes every view that reads notes (tree, canvas, map) plus
 * the affected note's history (relation changes are recorded there).
 */
function useInvalidateAfterRelationChange(projectId: number) {
	const queryClient = useQueryClient();
	return (noteId: number) => {
		queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		queryClient.invalidateQueries({
			queryKey: ["notes", "canvas", projectId],
		});
		queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
		queryClient.invalidateQueries({
			queryKey: ["notes", "history", projectId, noteId],
		});
	};
}

function relationErrorHandler(action: string) {
	return (err: unknown) => {
		console.error(`Failed to ${action}:`, err);
		toast.error(`Failed to ${action}`, {
			description:
				err instanceof Error ? err.message : "Ensure the api is online.",
		});
	};
}

/** Adds another note as a parent of `id` (notes may have multiple parents). */
export function useAddNoteParent(projectId: number) {
	const invalidate = useInvalidateAfterRelationChange(projectId);
	return useMutation({
		mutationFn: async ({ id, parentId }: { id: number; parentId: number }) => {
			const res = await noteControllerAddParent({
				path: { projectId, id },
				body: { parentId },
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => invalidate(variables.id),
		onError: relationErrorHandler("add parent note"),
	});
}

/** Removes a parent relation from `id`. */
export function useRemoveNoteParent(projectId: number) {
	const invalidate = useInvalidateAfterRelationChange(projectId);
	return useMutation({
		mutationFn: async ({ id, parentId }: { id: number; parentId: number }) => {
			const res = await noteControllerRemoveParent({
				path: { projectId, id, parentId },
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => invalidate(variables.id),
		onError: relationErrorHandler("remove parent note"),
	});
}

/** Adds another note as a child of `id` (notes may have multiple children). */
export function useAddNoteChild(projectId: number) {
	const invalidate = useInvalidateAfterRelationChange(projectId);
	return useMutation({
		mutationFn: async ({ id, childId }: { id: number; childId: number }) => {
			const res = await noteControllerAddChild({
				path: { projectId, id },
				body: { childId },
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => invalidate(variables.id),
		onError: relationErrorHandler("add child note"),
	});
}

/** Removes a child relation from `id`. */
export function useRemoveNoteChild(projectId: number) {
	const invalidate = useInvalidateAfterRelationChange(projectId);
	return useMutation({
		mutationFn: async ({ id, childId }: { id: number; childId: number }) => {
			const res = await noteControllerRemoveChild({
				path: { projectId, id, childId },
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => invalidate(variables.id),
		onError: relationErrorHandler("remove child note"),
	});
}
