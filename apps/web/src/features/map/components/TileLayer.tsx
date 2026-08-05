import { TileLayer as LeafletTileLayer } from "react-leaflet";
import { useMap } from "../hooks/useMap";

const TILE_LAYERS = {
	dark: {
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	},
	light: {
		url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	},
	street: {
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	},
};

export function TileLayer() {
	const { mapStyle } = useMap();
	const { url, attribution } = TILE_LAYERS[mapStyle];

	return (
		<LeafletTileLayer
			key={mapStyle} // Force re-render of TileLayer when skin style changes
			url={url}
			attribution={attribution}
			maxZoom={19}
		/>
	);
}
