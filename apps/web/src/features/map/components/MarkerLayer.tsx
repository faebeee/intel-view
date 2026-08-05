import L from "leaflet";
import * as React from "react";
import { Marker, Tooltip, useMap as useReactLeafletMap } from "react-leaflet";
import { useMap } from "../hooks/useMap";
import type { MapMarkerData } from "../types";

type MarkerLayerProps = {
	data: MapMarkerData[];
	onMarkerClick?: (marker: MapMarkerData) => void;
};

// Helper to create the neon-styled marker icon
const createNeonIcon = (category?: string) => {
	let colorClass = "bg-[#00f2ff]"; // Default lagoon cyan
	let pingClass = "bg-[#00f2ff]";

	if (category === "intel" || category === "note") {
		colorClass = "bg-[#38bdf8]"; // Palm blue
		pingClass = "bg-[#38bdf8]";
	} else if (category === "danger" || category === "critical") {
		colorClass = "bg-red-500";
		pingClass = "bg-red-500";
	} else if (category === "success" || category === "active") {
		colorClass = "bg-emerald-400";
		pingClass = "bg-emerald-400";
	} else if (category === "warning") {
		colorClass = "bg-amber-500";
		pingClass = "bg-amber-500";
	}

	return L.divIcon({
		className: "custom-neon-marker",
		html: `
			<div class="relative flex items-center justify-center w-6 h-6">
				<span class="absolute inline-flex h-6 w-6 animate-ping rounded-full ${pingClass} opacity-40"></span>
				<span class="relative inline-flex h-3.5 w-3.5 rounded-full ${colorClass} border border-white shadow-[0_0_8px_rgba(0,242,255,0.6)]"></span>
			</div>
		`,
		iconSize: [24, 24],
		iconAnchor: [12, 12],
	});
};

export function MarkerLayer({ data, onMarkerClick }: MarkerLayerProps) {
	const { setSelectedMarker, setMarkers } = useMap();
	const leafletMap = useReactLeafletMap();

	// Keep the context markers state updated for external use (like list views)
	React.useEffect(() => {
		setMarkers(data);
	}, [data, setMarkers]);

	return (
		<>
			{data.map((markerData) => {
				const { id, lat, lng, title, category } = markerData;
				const icon = createNeonIcon(category);

				return (
					<Marker
						key={id}
						position={[lat, lng]}
						icon={icon}
						eventHandlers={{
							click: () => {
								setSelectedMarker(markerData);
								if (onMarkerClick) {
									onMarkerClick(markerData);
								}
								// Smoothly focus map on marker
								leafletMap.flyTo(
									[lat, lng],
									leafletMap.getZoom() < 14 ? 14 : leafletMap.getZoom(),
									{
										animate: true,
										duration: 0.8,
									},
								);
							},
						}}
					>
						<Tooltip
							direction="top"
							offset={[0, -8]}
							className="bg-surface-strong border border-line text-sea-ink rounded px-2.5 py-1 text-xs font-medium shadow-md font-sans"
						>
							{title}
						</Tooltip>
					</Marker>
				);
			})}
		</>
	);
}
