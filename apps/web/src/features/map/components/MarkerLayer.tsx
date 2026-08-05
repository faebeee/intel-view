import L from "leaflet";
import * as React from "react";
import { Marker, Tooltip, useMap as useReactLeafletMap } from "react-leaflet";
import { useMap } from "../hooks/useMap";
import type { MapMarkerData } from "../types";

type MarkerLayerProps = {
	data: MapMarkerData[];
	onMarkerClick?: (marker: MapMarkerData) => void;
};

// Helper to create the neon-styled marker icon using dynamic tag gradients or solid fallbacks
const createNeonIcon = (
	tags?: { id: number; name: string; color: string }[],
	category?: string,
) => {
	let backgroundStyle = "";
	let shadowStyle = "";

	if (tags && tags.length > 0) {
		const colors = tags.map((t) => t.color);
		if (colors.length === 1) {
			const color = colors[0];
			backgroundStyle = `background-color: ${color}`;
			shadowStyle = `box-shadow: 0 0 10px ${color}`;
		} else {
			// Multi-stop linear gradient for notes with multiple tags
			const gradientColors = colors.join(", ");
			backgroundStyle = `background: linear-gradient(135deg, ${gradientColors})`;

			// Stack box-shadows for all assigned colors to create a multi-colored neon glow halo
			shadowStyle = `box-shadow: ${colors.map((c) => `0 0 10px ${c}`).join(", ")}`;
		}
	} else {
		// Category-based solid color fallbacks
		let color = "#38bdf8"; // Fallback Palm blue
		if (category === "danger" || category === "critical") {
			color = "#ef4444";
		} else if (category === "success" || category === "active") {
			color = "#10b981";
		} else if (category === "warning") {
			color = "#f59e0b";
		} else if (category === "intel" || category === "note") {
			color = "#38bdf8";
		} else {
			color = "#00f2ff"; // Default cyan
		}
		backgroundStyle = `background-color: ${color}`;
		shadowStyle = `box-shadow: 0 0 10px ${color}`;
	}

	return L.divIcon({
		className: "custom-neon-marker",
		html: `
			<div class="relative flex items-center justify-center w-6 h-6">
				<span class="absolute inline-flex h-6 w-6 animate-ping rounded-full opacity-40" style="${backgroundStyle}"></span>
				<span class="relative inline-flex h-3.5 w-3.5 rounded-full border border-white" style="${backgroundStyle}; ${shadowStyle}"></span>
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
				const { id, lat, lng, title, category, tags } = markerData;
				const icon = createNeonIcon(tags, category);

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
export default MarkerLayer;
