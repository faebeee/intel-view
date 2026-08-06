import * as React from "react";
import {
	MapContainer as LeafletMapContainer,
	useMap as useReactLeafletMap,
} from "react-leaflet";
import { useMap } from "../hooks/useMap";
import type { Coordinate } from "../types";

type MapContainerProps = {
	center?: Coordinate;
	zoom?: number;
	minZoom?: number;
	maxZoom?: number;
	children?: React.ReactNode;
	className?: string;
};

function MapInstanceConnector() {
	const leafletMap = useReactLeafletMap();
	const { setMap } = useMap();

	React.useEffect(() => {
		setMap(leafletMap);
		return () => {
			setMap(null);
		};
	}, [leafletMap, setMap]);

	return null;
}

export function MapContainer({
	center = [48.1351, 11.582],
	zoom = 13,
	minZoom = 3,
	maxZoom,
	children,
	className = "w-full h-full min-h-[400px]",
}: MapContainerProps) {
	return (
		<div className="relative isolate w-full h-full flex-1 min-h-0 bg-[#030712]">
			<LeafletMapContainer
				center={center}
				zoom={zoom}
				minZoom={minZoom}
				maxZoom={maxZoom}
				zoomControl={false}
				attributionControl={false}
				className={className}
			>
				<MapInstanceConnector />
				{children}
			</LeafletMapContainer>
		</div>
	);
}
