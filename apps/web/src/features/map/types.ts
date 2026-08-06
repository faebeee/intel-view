export type Coordinate = [number, number];

export type MapMarkerData = {
	id: string;
	lat: number;
	lng: number;
	title: string;
	description?: string;
	category?: string;
	metadata?: Record<string, unknown>;
	tags?: { id: string; name: string; color: string }[];
};

export type MapConfig = {
	center: Coordinate;
	zoom: number;
	minZoom?: number;
	maxZoom?: number;
};
