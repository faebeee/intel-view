import L from "leaflet";
import { Layers, Locate, ZoomIn, ZoomOut } from "lucide-react";
import * as React from "react";
import { useMap as useReactLeafletMap } from "react-leaflet";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useMap } from "../hooks/useMap";
import type { MapStyleValue } from "../types";

export function MapControls() {
	const { mapStyle, setMapStyle } = useMap();
	const leafletMap = useReactLeafletMap();
	const [locating, setLocating] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		if (containerRef.current) {
			L.DomEvent.disableClickPropagation(containerRef.current);
			L.DomEvent.disableScrollPropagation(containerRef.current);
		}
	}, []);

	const handleZoomIn = () => {
		leafletMap.zoomIn();
	};

	const handleZoomOut = () => {
		leafletMap.zoomOut();
	};

	const handleLocateMe = () => {
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const { latitude, longitude } = position.coords;
				leafletMap.flyTo([latitude, longitude], 15, {
					animate: true,
					duration: 1,
				});
				setLocating(false);
			},
			(error) => {
				console.error("Error getting location:", error);
				setLocating(false);
			},
			{ enableHighAccuracy: true, timeout: 5000 },
		);
	};

	return (
		<div ref={containerRef} className="absolute right-4 bottom-4 z-500 flex flex-col gap-2">
			{/* Zoom Controls */}
			<div className="flex flex-col rounded-lg border border-line bg-surface-strong backdrop-blur-md overflow-hidden shadow-lg shadow-black/40">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleZoomIn}
					title="Zoom In"
				>
					<ZoomIn className="h-5 w-5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleZoomOut}
					title="Zoom Out"
				>
					<ZoomOut className="h-5 w-5" />
				</Button>
			</div>

			{/* Location Control */}
			<Button
				variant="outline"
				size="icon-sm"
				onClick={handleLocateMe}
				disabled={locating}
				title="Locate Me"
			>
				<Locate
					className={`h-5 w-5 ${locating ? "animate-spin text-lagoon" : ""}`}
				/>
			</Button>

			{/* Style Layers Selector */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="icon-sm"
						title="Change Style"
					>
						<Layers className="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="z-[1000] w-36 bg-surface-strong border border-line text-sea-ink backdrop-blur-md">
					<DropdownMenuRadioGroup
						value={mapStyle}
						onValueChange={(value) => setMapStyle(value as MapStyleValue)}
					>
						<DropdownMenuRadioItem
							value="dark"
							className="focus:bg-line/20 focus:text-lagoon cursor-pointer text-xs"
						>
							Dark Cyber
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem
							value="light"
							className="focus:bg-line/20 focus:text-lagoon cursor-pointer text-xs"
						>
							Light Clean
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem
							value="street"
							className="focus:bg-line/20 focus:text-lagoon cursor-pointer text-xs"
						>
							Standard Street
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem
							value="satellite"
							className="focus:bg-line/20 focus:text-lagoon cursor-pointer text-xs"
						>
							Satellite
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
