import * as React from "react";
import type { LeafletEvent } from "leaflet";
import {
	LayersControl,
	MapContainer,
	Marker,
	TileLayer,
	useMap,
	useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ensureLeafletDefaultIcon } from "#/features/map/lib/leaflet-icon-fix.ts";
import {
	DEFAULT_MAP_THEME,
	MAP_THEMES,
	type MapTheme,
	type MapThemeId,
} from "#/features/map/lib/map-themes.ts";
import { cn } from "#/lib/utils.ts";

/** Default map center (roughly the middle of the Atlantic) shown when no other center is given. */
export const DEFAULT_MAP_CENTER: [number, number] = [20, 0];
export const DEFAULT_MAP_ZOOM = 2;

function MapClickHandler({
	onClick,
}: {
	onClick: (lat: number, lng: number) => void;
}) {
	useMapEvents({
		click(event) {
			onClick(event.latlng.lat, event.latlng.lng);
		},
	});
	return null;
}

/**
 * Listens for the layers control's "base layer changed" event (fired by
 * Leaflet whenever the user picks a different base layer from
 * `LayersControl`) and reports the newly selected theme's id back to the
 * caller, so it can be persisted (e.g. on the `Project` entity).
 */
function BaseLayerChangeHandler({
	onThemeChange,
}: {
	onThemeChange: (theme: MapThemeId) => void;
}) {
	useMapEvents({
		baselayerchange(event: LeafletEvent & { name: string }) {
			const theme = MAP_THEMES.find((t) => t.label === event.name);
			if (theme) onThemeChange(theme.id);
		},
	});
	return null;
}

/** Imperatively recenters/zooms the map whenever `lat`/`lng` change. */
function FlyToLocation({
	lat,
	lng,
	zoom,
}: {
	lat: number;
	lng: number;
	zoom?: number;
}) {
	const map = useMap();
	const lastRef = React.useRef<string | null>(null);
	React.useEffect(() => {
		const key = `${lat},${lng}`;
		if (lastRef.current === key) return;
		lastRef.current = key;
		map.setView(
			[lat, lng],
			zoom ?? Math.max(map.getZoom(), DEFAULT_FLY_TO_ZOOM),
		);
	}, [lat, lng, zoom, map]);
	return null;
}

const DEFAULT_FLY_TO_ZOOM = 6;

export type LeafletMapProps = {
	/** Initial map center. Defaults to a low-zoom world view. */
	center?: [number, number];
	/** Initial zoom level. Defaults to a low-zoom world view. */
	zoom?: number;
	className?: string;
	scrollWheelZoom?: boolean;
	/** Called with the clicked point's coordinates whenever the map is clicked. Omit to disable click handling. */
	onClick?: (lat: number, lng: number) => void;
	/**
	 * When set, imperatively recenters (and optionally zooms) the map to
	 * these coordinates whenever they change — e.g. after a pin is placed
	 * or an address search result is selected.
	 */
	flyTo?: { lat: number; lng: number; zoom?: number } | null;
	/** A single pinned point to render as a marker, e.g. the currently selected location. */
	pin?: { lat: number; lng: number } | null;
	/** Whether to render the layer-switcher control letting users pick between the map themes (street/satellite/dark/futuristic, etc.). Defaults to `true`. */
	showLayersControl?: boolean;
	/** Which base map theme is initially checked in the layers control. Defaults to `DEFAULT_MAP_THEME` ('street'). */
	theme?: MapThemeId;
	/** Called with the newly selected theme's id whenever the user switches base layers via the layers control. Omit if the choice doesn't need to be persisted. */
	onThemeChange?: (theme: MapThemeId) => void;
	/** Additional markers/overlays (e.g. `<Marker />`, `<Popup />`) rendered inside the map. */
	children?: React.ReactNode;
};

/**
 * Renders the tile layer for one base map theme, wiring up its URL,
 * attribution, zoom range, subdomains, and any per-tile styling class.
 */
function MapThemeLayer({ theme }: { theme: MapTheme }) {
	return (
		<TileLayer
			attribution={theme.attribution}
			url={theme.url}
			maxZoom={theme.maxZoom}
			subdomains={theme.subdomains ?? "abc"}
			className={theme.className}
		/>
	);
}

/**
 * Reusable map powered by Leaflet/`react-leaflet`. Wraps the base map
 * themes (street, satellite, light, dark and a neon "futuristic" look,
 * switchable via a layers control), the default-marker-icon fix, click
 * handling, and imperative recentering so consumers across the app
 * (location pickers, map views, read-only previews, etc.) don't need to
 * deal with Leaflet/Vite plumbing directly.
 *
 * The map's themes are intentionally decoupled from the app's UI theme
 * (dark mode, `ocean`/`emerald`/`violet`/`monochrome` color themes, set on
 * `<html>` by `ThemeProvider`) — the map has its own theme switcher so tile
 * imagery can be chosen independently of the surrounding chrome.
 */
export function LeafletMap({
	center = DEFAULT_MAP_CENTER,
	zoom = DEFAULT_MAP_ZOOM,
	className,
	scrollWheelZoom = true,
	onClick,
	flyTo,
	pin,
	showLayersControl = true,
	theme = DEFAULT_MAP_THEME,
	onThemeChange,
	children,
}: LeafletMapProps) {
	ensureLeafletDefaultIcon();

	return (
		<MapContainer
			center={center}
			zoom={zoom}
			className={cn("h-full w-full", className)}
			scrollWheelZoom={scrollWheelZoom}
		>
			{showLayersControl ? (
				<LayersControl position="topright">
					{MAP_THEMES.map((mapTheme) => (
						<LayersControl.BaseLayer
							key={mapTheme.id}
							name={mapTheme.label}
							checked={mapTheme.id === theme}
						>
							<MapThemeLayer theme={mapTheme} />
						</LayersControl.BaseLayer>
					))}
				</LayersControl>
			) : (
				<MapThemeLayer
					theme={MAP_THEMES.find((t) => t.id === theme) ?? MAP_THEMES[0]}
				/>
			)}
			{showLayersControl && onThemeChange && (
				<BaseLayerChangeHandler onThemeChange={onThemeChange} />
			)}
			{onClick && <MapClickHandler onClick={onClick} />}
			{flyTo && (
				<FlyToLocation lat={flyTo.lat} lng={flyTo.lng} zoom={flyTo.zoom} />
			)}
			{pin && <Marker position={[pin.lat, pin.lng]} />}
			{children}
		</MapContainer>
	);
}

// Re-exported for convenience so consumers can render additional markers
// without needing a direct dependency on `react-leaflet` themselves.
export { Marker as LeafletMarker } from "react-leaflet";
