import type L from "leaflet";
import * as React from "react";
import type { MapMarkerData, MapStyleValue } from "../types";

export type MapContextType = {
	map: L.Map | null;
	setMap: (map: L.Map | null) => void;
	markers: MapMarkerData[];
	setMarkers: React.Dispatch<React.SetStateAction<MapMarkerData[]>>;
	selectedMarker: MapMarkerData | null;
	setSelectedMarker: (marker: MapMarkerData | null) => void;
	mapStyle: MapStyleValue;
	setMapStyle: (style: MapStyleValue) => void;
};

export const MapContext = React.createContext<MapContextType | undefined>(
	undefined,
);

type MapProviderProps = {
	children: React.ReactNode;
	// Persisted style loaded from the project (e.g. from the backend). Once
	// provided, it hydrates the map's style a single time.
	initialMapStyle?: MapStyleValue;
	// Called whenever the user picks a different style, so callers can
	// persist the change (e.g. save it on the project).
	onMapStyleChange?: (style: MapStyleValue) => void;
};

export function MapProvider({
	children,
	initialMapStyle,
	onMapStyleChange,
}: MapProviderProps) {
	const [map, setMap] = React.useState<L.Map | null>(null);
	const [markers, setMarkers] = React.useState<MapMarkerData[]>([]);
	const [selectedMarker, setSelectedMarker] =
		React.useState<MapMarkerData | null>(null);
	const [mapStyle, setMapStyleState] = React.useState<MapStyleValue>(
		initialMapStyle ?? "dark",
	);

	// Hydrate the map style once the persisted value becomes available
	// (it's typically fetched asynchronously after this provider mounts).
	const hasHydratedRef = React.useRef(Boolean(initialMapStyle));
	React.useEffect(() => {
		if (!hasHydratedRef.current && initialMapStyle) {
			hasHydratedRef.current = true;
			setMapStyleState(initialMapStyle);
		}
	}, [initialMapStyle]);

	const onMapStyleChangeRef = React.useRef(onMapStyleChange);
	React.useEffect(() => {
		onMapStyleChangeRef.current = onMapStyleChange;
	}, [onMapStyleChange]);

	const setMapStyle = React.useCallback((style: MapStyleValue) => {
		setMapStyleState(style);
		onMapStyleChangeRef.current?.(style);
	}, []);

	const value = React.useMemo(
		() => ({
			map,
			setMap,
			markers,
			setMarkers,
			selectedMarker,
			setSelectedMarker,
			mapStyle,
			setMapStyle,
		}),
		[map, markers, selectedMarker, mapStyle, setMapStyle],
	);

	return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
