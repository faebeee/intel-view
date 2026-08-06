import type { NoteResponseDto as Note } from "@repo/sdk";

export type NoteTreeNode = {
	note: Note;
	children: NoteTreeNode[];
};

/**
 * Builds a nested tree structure from a flat list of notes using each
 * note's `parentId`. Notes whose `parentId` doesn't resolve to another
 * note in the list (e.g. the parent was filtered out, or deleted) are
 * defensively treated as root nodes so they are never silently dropped.
 */
export function buildNoteTree(notes: Note[]): NoteTreeNode[] {
	const nodeById = new Map<number, NoteTreeNode>();
	for (const note of notes) {
		nodeById.set(note.id, { note, children: [] });
	}

	const roots: NoteTreeNode[] = [];

	for (const note of notes) {
		const node = nodeById.get(note.id);
		if (!node) continue;

		const parentNode =
			note.parentId !== null && note.parentId !== undefined
				? nodeById.get(note.parentId)
				: undefined;

		if (parentNode) {
			parentNode.children.push(node);
		} else {
			roots.push(node);
		}
	}

	return roots;
}

/**
 * Returns the IDs of all descendants (children, grandchildren, etc.) of
 * `rootId` within the given flat list of notes.
 */
export function getDescendantIds(notes: Note[], rootId: number): number[] {
	const childrenByParent = new Map<number, number[]>();
	for (const note of notes) {
		if (note.parentId === null || note.parentId === undefined) continue;
		const siblings = childrenByParent.get(note.parentId) ?? [];
		siblings.push(note.id);
		childrenByParent.set(note.parentId, siblings);
	}

	const descendants: number[] = [];
	const queue: number[] = [...(childrenByParent.get(rootId) ?? [])];
	while (queue.length > 0) {
		const id = queue.shift();
		if (id === undefined) break;
		descendants.push(id);
		const children = childrenByParent.get(id) ?? [];
		queue.push(...children);
	}

	return descendants;
}
