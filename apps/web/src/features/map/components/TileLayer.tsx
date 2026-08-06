import { TileLayer as LeafletTileLayer } from "react-leaflet";
import { useMap } from "../hooks/useMap";
import type { MapStyleValue } from "../types";

// Native zoom level up to which each provider actually has tiles. Beyond
// this, Leaflet upscales the last available tile so users can keep zooming
// in without hitting a hard "max zoom" wall.
const TILE_LAYERS: Record<
	MapStyleValue,
	{ url: string; attribution: string; maxNativeZoom: number }
> = {
	dark: {
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxNativeZoom: 20,
	},
	light: {
		url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxNativeZoom: 20,
	},
	street: {
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxNativeZoom: 19,
	},
	satellite: {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		attribution:
			"Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
		maxNativeZoom: 19,
	},
};

// Effectively removes any max zoom limit: the map/tile layer will keep
// letting users zoom in, upscaling tiles past each provider's native zoom.
const UNLIMITED_MAX_ZOOM = 24;

export function TileLayer() {
	const { mapStyle } = useMap();
	const { url, attribution, maxNativeZoom } = TILE_LAYERS[mapStyle];

	return (
		<LeafletTileLayer
			key={mapStyle} // Force re-render of TileLayer when skin style changes
			url={url}
			attribution={attribution}
			maxZoom={UNLIMITED_MAX_ZOOM}
			maxNativeZoom={maxNativeZoom}
		/>
	);
}
