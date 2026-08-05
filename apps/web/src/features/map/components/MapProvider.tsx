import type L from "leaflet";
import * as React from "react";
import type { MapMarkerData } from "../types";

export type MapContextType = {
	map: L.Map | null;
	setMap: (map: L.Map | null) => void;
	markers: MapMarkerData[];
	setMarkers: React.Dispatch<React.SetStateAction<MapMarkerData[]>>;
	selectedMarker: MapMarkerData | null;
	setSelectedMarker: (marker: MapMarkerData | null) => void;
	mapStyle: "dark" | "light" | "street";
	setMapStyle: (style: "dark" | "light" | "street") => void;
};

export const MapContext = React.createContext<MapContextType | undefined>(
	undefined,
);

type MapProviderProps = {
	children: React.ReactNode;
};

export function MapProvider({ children }: MapProviderProps) {
	const [map, setMap] = React.useState<L.Map | null>(null);
	const [markers, setMarkers] = React.useState<MapMarkerData[]>([]);
	const [selectedMarker, setSelectedMarker] =
		React.useState<MapMarkerData | null>(null);
	const [mapStyle, setMapStyle] = React.useState<"dark" | "light" | "street">(
		"dark",
	);

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
		[map, markers, selectedMarker, mapStyle],
	);

	return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}
