import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate, noteControllerCreateLogEntry } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NoteImportPlan } from "../note-import";

export type ImportNotesArgs = {
	plan: NoteImportPlan;
	/** Canvas position of the first (top-left) imported note. */
	origin: { x: number; y: number };
};

/** Thrown when an import stops part-way; notes created before the failure are kept. */
export class NoteImportError extends Error {
	constructor(
		message: string,
		readonly created: Note[],
	) {
		super(message);
		this.name = "NoteImportError";
	}
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "object" && error !== null && "message" in error) {
		const message = (error as { message: unknown }).message;
		return Array.isArray(message) ? message.join(", ") : String(message);
	}
	return "Ensure the api is online.";
}

/**
 * Creates the notes of a parsed clipboard import (see `note-import.ts`).
 * The plan is already in parent-before-child order, so each note can link to
 * the IDs of parents created earlier in the same run.
 */
export function useImportNotes(projectId: number) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ plan, origin }: ImportNotesArgs): Promise<Note[]> => {
			const idByKey = new Map<string, number>();
			const created: Note[] = [];
			for (const planned of plan.notes) {
				const label = planned.title || planned.key;
				try {
					const res = await noteControllerCreate({
						path: { projectId },
						body: {
							type: planned.type,
							title: planned.title,
							content: planned.content,
							tags: planned.tags,
							color: planned.color,
							version: planned.version,
							canvasX: origin.x + planned.offset.x,
							canvasY: origin.y + planned.offset.y,
							parentIds: [
								...planned.parentKeys.map((key) => idByKey.get(key) as number),
								...planned.existingParentIds,
							],
						},
						throwOnError: true,
					});
					const note = res.data as Note;
					idByKey.set(planned.key, note.id);
					created.push(note);
					for (const entry of planned.entries) {
						await noteControllerCreateLogEntry({
							path: { projectId, id: note.id },
							body: { content: entry },
							throwOnError: true,
						});
					}
				} catch (error) {
					throw new NoteImportError(
						`"${label}": ${errorMessage(error)}`,
						created,
					);
				}
			}
			return created;
		},
		onSettled: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "canvas", projectId],
			});
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		},
	});
}
