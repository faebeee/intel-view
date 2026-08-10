import * as React from "react";
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
	/** Whether to render the layer-switcher control letting users pick between street/satellite tiles. Defaults to `true`. */
	showLayersControl?: boolean;
	/** Additional markers/overlays (e.g. `<Marker />`, `<Popup />`) rendered inside the map. */
	children?: React.ReactNode;
};

/**
 * Reusable OpenStreetMap map powered by Leaflet/`react-leaflet`. Wraps the
 * tile layers (street + satellite, switchable via a layers control),
 * default-marker-icon fix, click handling, and imperative recentering so
 * consumers across the app (location pickers, map views, read-only
 * previews, etc.) don't need to deal with Leaflet/Vite plumbing directly.
 *
 * The "Street" layer is automatically re-tinted (via CSS filters keyed off
 * the `.dark` class and `data-theme` attribute already applied to `<html>`
 * by the app's `ThemeProvider`) to correlate with the currently selected UI
 * theme — e.g. it turns dark in dark mode, and picks up a hue matching the
 * `ocean`/`emerald`/`violet`/`monochrome` color theme. See the
 * `.map-tile-street` rules in `styles.css`. The satellite layer is left
 * untouched (aside from monochrome mode) so real imagery stays legible.
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
	children,
}: LeafletMapProps) {
	ensureLeafletDefaultIcon();

	const streetLayer = (
		<TileLayer
			className="map-tile-street"
			attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		/>
	);
	const satelliteLayer = (
		<TileLayer
			className="map-tile-satellite"
			attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
			url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
			maxZoom={19}
		/>
	);

	return (
		<MapContainer
			center={center}
			zoom={zoom}
			className={cn("h-full w-full", className)}
			scrollWheelZoom={scrollWheelZoom}
		>
			{showLayersControl ? (
				<LayersControl position="topright">
					<LayersControl.BaseLayer checked name="Street">
						{streetLayer}
					</LayersControl.BaseLayer>
					<LayersControl.BaseLayer name="Satellite">
						{satelliteLayer}
					</LayersControl.BaseLayer>
				</LayersControl>
			) : (
				streetLayer
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
