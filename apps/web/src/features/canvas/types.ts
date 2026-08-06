import type { NoteResponseDto as Note } from "@repo/sdk";

/** React Flow node data payload for a note rendered on the canvas. */
export type NoteNodeData = {
	note: Note;
	onDelete?: (id: number) => void;
	onView?: (id: number) => void;
	[key: string]: unknown;
};

/** Fallback grid layout used for notes that have no saved canvas position yet. */
export const CANVAS_GRID_COLUMNS = 4;
export const CANVAS_GRID_CELL_WIDTH = 260;
export const CANVAS_GRID_CELL_HEIGHT = 180;

export type { Note };
