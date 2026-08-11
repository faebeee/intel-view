/**
 * Base map themes available on every Leaflet map. Each theme is rendered as
 * a switchable base layer in the map's layers control (see
 * `LeafletMap.tsx`). They are intentionally independent from the app's
 * light/dark UI mode and color theme, so users pick the map look they want
 * regardless of the surrounding chrome.
 */

export type MapThemeId =
	| "street"
	| "satellite"
	| "light"
	| "dark"
	| "futuristic";

export type MapTheme = {
	id: MapThemeId;
	label: string;
	url: string;
	attribution: string;
	maxZoom: number;
	/** Subdomains used by the tile provider's `{s}` placeholder. Defaults to `abc`. */
	subdomains?: string;
	/**
	 * Extra CSS class applied to each tile image, used for custom looks
	 * (e.g. the neon filter on the futuristic theme, see styles.css).
	 */
	className?: string;
};

/** The base layer checked by default on every map. */
export const DEFAULT_MAP_THEME: MapThemeId = "street";

export const MAP_THEMES: readonly MapTheme[] = [
	{
		id: "street",
		label: "Street",
		url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		maxZoom: 19,
	},
	{
		id: "satellite",
		label: "Satellite",
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		attribution:
			'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
		maxZoom: 19,
	},
	{
		id: "light",
		label: "Light",
		url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 20,
		subdomains: "abcd",
	},
	{
		id: "dark",
		label: "Dark",
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 20,
		subdomains: "abcd",
	},
	{
		id: "futuristic",
		label: "Futuristic",
		url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		maxZoom: 20,
		subdomains: "abcd",
		/** Rendered as glowing neon cyan on deep navy via the `.map-tiles-futuristic` filter in styles.css. */
		className: "map-tiles-futuristic",
	},
];
