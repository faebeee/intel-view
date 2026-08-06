import type { NoteType } from "#/features/notes/noteTypes.ts";

export type Coordinate = [number, number];

export type MapStyleValue = "dark" | "light" | "street" | "satellite";

export type MapMarkerData = {
	id: string;
	lat: number;
	lng: number;
	title: string;
	description?: string;
	category?: string;
	metadata?: Record<string, unknown>;
	tags?: { id: string; name: string; color: string }[];
	type?: NoteType;
	config?: Record<string, unknown> | null;
	/** ID of the parent note this note is nested under, if any. */
	parentId?: number | null;
};

export type MapConfig = {
	center: Coordinate;
	zoom: number;
	minZoom?: number;
	maxZoom?: number;
};
