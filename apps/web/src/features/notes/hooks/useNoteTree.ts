import type { NoteResponseDto as Note } from "@repo/sdk";
import * as React from "react";

/**
 * A sentinel map key for root (top-level, no-parent) notes — needs a
 * stable, non-`null` key since notes are grouped by parent id and a note
 * may have zero parents.
 */
const ROOT_KEY = -1;

export type NoteChildrenMap = Map<number, Note[]>;

/**
 * Groups a flat list of notes by parent id, based on each note's
 * `parentIds`. Notes form a directed acyclic graph (DAG) rather than a
 * strict tree — a note with multiple parents appears once per parent it's
 * grouped under (and once under `ROOT_KEY` if it also has no parents, which
 * shouldn't normally happen but is handled defensively). Root (top-level)
 * notes — those with no parents — are grouped under `ROOT_KEY`.
 */
export function buildNoteChildrenMap(notes: Note[]): NoteChildrenMap {
	const map: NoteChildrenMap = new Map();
	const addUnder = (key: number, note: Note) => {
		const siblings = map.get(key) ?? [];
		siblings.push(note);
		map.set(key, siblings);
	};
	for (const note of notes) {
		const parentIds = note.parentIds ?? [];
		if (parentIds.length === 0) {
			addUnder(ROOT_KEY, note);
			continue;
		}
		for (const parentId of parentIds) {
			addUnder(parentId, note);
		}
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
 * `rootId`, mirroring the backend's cycle-prevention logic. Since a note may
 * have multiple parents, the same descendant may be reachable via multiple
 * paths — each is only visited (and included) once. Used to exclude a note
 * and its descendants from its own "parent" picker options.
 */
export function getDescendantIds(
	childrenMap: NoteChildrenMap,
	rootId: number,
): number[] {
	const descendants: number[] = [];
	const visited = new Set<number>();
	const queue: number[] = getChildNotes(childrenMap, rootId).map((n) => n.id);
	while (queue.length > 0) {
		const id = queue.shift();
		if (id === undefined || visited.has(id)) continue;
		visited.add(id);
		descendants.push(id);
		queue.push(...getChildNotes(childrenMap, id).map((n) => n.id));
	}
	return descendants;
}

/**
 * Returns the ids of every ancestor (parents, grandparents, ...) of a note,
 * given the flat notes list. Since a note may have multiple parents, this
 * is a set reachable via multiple paths rather than a single chain.
 */
export function getAncestorIds(notes: Note[], noteId: number): number[] {
	const byId = new Map(notes.map((n) => [n.id, n]));
	const ancestors: number[] = [];
	const visited = new Set<number>();
	const queue: number[] = [...(byId.get(noteId)?.parentIds ?? [])];
	while (queue.length > 0) {
		const id = queue.shift();
		if (id === undefined || visited.has(id)) continue;
		visited.add(id);
		ancestors.push(id);
		queue.push(...(byId.get(id)?.parentIds ?? []));
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

/** Builds the id set to exclude (self + all ancestors) when picking a valid child note for `noteId`. */
export function useInvalidChildIds(
	notes: Note[],
	noteId: number | undefined,
): Set<number> {
	return React.useMemo(() => {
		if (noteId === undefined) return new Set<number>();
		return new Set<number>([noteId, ...getAncestorIds(notes, noteId)]);
	}, [notes, noteId]);
}

/** A note paired with its nesting depth (0 = root/top-level) within the tree. */
export type NoteWithDepth = { note: Note; depth: number };

/**
 * Flattens the note relation graph into a pre-order (parent immediately
 * followed by its children, recursively) list of `{ note, depth }` pairs,
 * so a plain list UI (no `NoteTree`-style collapsing) can still render
 * nesting levels via indentation. Since a note may have multiple parents,
 * it can appear more than once (once per parent path) — recursion is only
 * cut short along the current path (to guard against an unexpected cycle),
 * not globally, so legitimate multi-parent notes still appear everywhere
 * they belong.
 */
export function flattenNoteTree(childrenMap: NoteChildrenMap): NoteWithDepth[] {
	const result: NoteWithDepth[] = [];

	function visit(note: Note, depth: number, path: Set<number>): void {
		if (path.has(note.id)) return;
		result.push({ note, depth });
		const nextPath = new Set(path).add(note.id);
		for (const child of getChildNotes(childrenMap, note.id)) {
			visit(child, depth + 1, nextPath);
		}
	}

	for (const rootNote of getRootNotes(childrenMap)) {
		visit(rootNote, 0, new Set());
	}

	return result;
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

/**
 * Resolves the color a note should be displayed with: its own custom
 * `color` if set, otherwise the registered color of its first tag (if it
 * has any tags and that tag is registered), otherwise `undefined` (callers
 * fall back to their own default). Shared by every view that colorizes
 * notes (canvas cards, map pins, the notes tree).
 */
export function resolveNoteColor(
	note: Pick<Note, "color" | "tags">,
	tagColorMap: Map<string, string>,
): string | undefined {
	if (note.color) return note.color;
	const firstTag = note.tags?.[0];
	return firstTag ? tagColorMap.get(firstTag.toLowerCase()) : undefined;
}
