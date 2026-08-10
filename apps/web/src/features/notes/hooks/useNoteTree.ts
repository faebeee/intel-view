import type { NoteResponseDto as Note } from "@repo/sdk";
import * as React from "react";

/** A `null` parentId key (root notes) needs a stable, non-`null` map key since `Map` treats `null`/`undefined` distinctly. */
const ROOT_KEY = -1;

function parentKey(parentId: number | null | undefined): number {
	return parentId === null || parentId === undefined ? ROOT_KEY : parentId;
}

export type NoteChildrenMap = Map<number, Note[]>;

/** Groups a flat list of notes by `parentId`, with root (top-level) notes keyed under `ROOT_KEY`. */
export function buildNoteChildrenMap(notes: Note[]): NoteChildrenMap {
	const map: NoteChildrenMap = new Map();
	for (const note of notes) {
		const key = parentKey(note.parentId);
		const siblings = map.get(key) ?? [];
		siblings.push(note);
		map.set(key, siblings);
	}
	return map;
}

export function getRootNotes(childrenMap: NoteChildrenMap): Note[] {
	return childrenMap.get(ROOT_KEY) ?? [];
}

export function getChildNotes(
	childrenMap: NoteChildrenMap,
	noteId: number,
): Note[] {
	return childrenMap.get(noteId) ?? [];
}

/**
 * Collects the ids of every descendant (children, grandchildren, ...) of
 * `rootId`, mirroring the backend's cycle-prevention logic. Used to exclude
 * a note and its descendants from its own "parent" picker options.
 */
export function getDescendantIds(
	childrenMap: NoteChildrenMap,
	rootId: number,
): number[] {
	const descendants: number[] = [];
	const queue: number[] = getChildNotes(childrenMap, rootId).map((n) => n.id);
	while (queue.length > 0) {
		const id = queue.shift();
		if (id === undefined) continue;
		descendants.push(id);
		queue.push(...getChildNotes(childrenMap, id).map((n) => n.id));
	}
	return descendants;
}

/** Returns the chain of ancestor ids (immediate parent first) for a note, given the flat notes list. */
export function getAncestorIds(notes: Note[], noteId: number): number[] {
	const byId = new Map(notes.map((n) => [n.id, n]));
	const ancestors: number[] = [];
	let current = byId.get(noteId);
	const visited = new Set<number>();
	while (current?.parentId !== null && current?.parentId !== undefined) {
		if (visited.has(current.parentId)) break;
		visited.add(current.parentId);
		ancestors.push(current.parentId);
		current = byId.get(current.parentId);
	}
	return ancestors;
}

/** Builds the id set to exclude (self + all descendants) when picking a valid parent note for `noteId`. */
export function useInvalidParentIds(
	notes: Note[],
	noteId: number | undefined,
): Set<number> {
	return React.useMemo(() => {
		if (noteId === undefined) return new Set<number>();
		const childrenMap = buildNoteChildrenMap(notes);
		return new Set<number>([noteId, ...getDescendantIds(childrenMap, noteId)]);
	}, [notes, noteId]);
}

/** Short human-readable label for a note: its title, or a truncated content snippet, or a placeholder. */
export function getNoteLabel(
	note: Pick<Note, "title" | "content">,
	maxLength = 60,
): string {
	if (note.title?.trim()) return note.title.trim();
	const snippet = note.content?.trim().replace(/\s+/g, " ");
	if (snippet) {
		return snippet.length > maxLength
			? `${snippet.slice(0, maxLength)}…`
			: snippet;
	}
	return "Untitled note";
}
