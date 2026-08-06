import { MapPin, PlusCircle, RefreshCw, Search, X } from "lucide-react";
import * as React from "react";
import { useMapEvents } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal";
import { Markdown } from "#/components/ui/markdown.tsx";
import { useMap } from "../hooks/useMap";
import { useNotesQuery } from "../hooks/useNotesQuery";
import type { Coordinate, MapMarkerData } from "../types";
import { MapContainer } from "./MapContainer";
import { MapControls } from "./MapControls";
import { MapProvider } from "./MapProvider";
import { MapSearch } from "./MapSearch";
import { MarkerLayer } from "./MarkerLayer";
import { TileLayer } from "./TileLayer";

type MapClickHandlerProps = {
	onMapClick: (lat: number, lng: number) => void;
};

// Map click event handler
function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
	useMapEvents({
		click(e) {
			onMapClick(e.latlng.lat, e.latlng.lng);
		},
	});
	return null;
}

function MapInnerView() {
	const { map, selectedMarker, setSelectedMarker } = useMap();
	const { data: notes = [], refetch } = useNotesQuery();
	const [searchQuery, setSearchQuery] = React.useState("");

	// Add Note Modal states
	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [clickedCoordinates, setClickedCoordinates] = React.useState<{
		lat: number;
		lng: number;
	} | null>(null);

	// Center point defaulted to Munich, or dynamically focus on first note if available
	const defaultCenter: Coordinate = React.useMemo(() => {
		if (notes.length > 0) {
			return [notes[0].lat, notes[0].lng];
		}
		return [48.1351, 11.582];
	}, [notes]);

	// Filter notes based on search query
	const filteredAssets = React.useMemo(() => {
		return notes.filter((asset) => {
			return (
				asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false)
			);
		});
	}, [notes, searchQuery]);

	const handleFocusAsset = (asset: MapMarkerData) => {
		setSelectedMarker(asset);
		if (map) {
			map.flyTo([asset.lat, asset.lng], 15, {
				animate: true,
				duration: 0.8,
			});
		}
	};

	const handleMapClick = (lat: number, lng: number) => {
		setClickedCoordinates({ lat, lng });
		setIsCreateOpen(true);
	};

	return (
		<div className="flex flex-col md:flex-row h-full w-full min-h-0 divide-y md:divide-y-0 md:divide-x divide-line bg-background">
			{/* Left Sidebar Control Panel */}
			<div className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 bg-surface-strong/95 backdrop-blur-md z-10 overflow-hidden">
				{/* Sidebar Header */}
				<div className="p-4 border-b border-line flex flex-col gap-1 shrink-0">
					<div className="flex items-center justify-between">
						<h1 className="text-lg font-bold text-sea-ink">Map</h1>
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={() => refetch()}
							title="Refresh notes"
						>
							<RefreshCw className="h-3 w-3" />
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						View and manage notes geographically.
					</p>
				</div>

				{/* Search & Actions */}
				<div className="p-4 border-b border-line flex flex-col gap-3 shrink-0 bg-surface">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search notes..."
							className="pl-9 bg-[#040814]/60 border-line text-xs h-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setClickedCoordinates(null);
							setIsCreateOpen(true);
						}}
					>
						<PlusCircle className="h-4 w-4" />
						<span>Add Note</span>
					</Button>

					<div className="text-[10px] text-muted-foreground leading-normal font-sans bg-[#040814]/30 border border-line/30 rounded p-2 text-center select-none">
						Click anywhere on the map to add a note at those coordinates.
					</div>
				</div>

				{/* Notes List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
					{filteredAssets.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-4">
							<MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
							<p className="text-xs text-muted-foreground font-medium">
								No notes found
							</p>
						</div>
					) : (
						filteredAssets.map((asset) => (
							<button
								type="button"
								key={asset.id}
								onClick={() => handleFocusAsset(asset)}
								className={`w-full group p-3 rounded-lg border text-left cursor-pointer transition-all ${
									selectedMarker?.id === asset.id
										? "border-palm bg-[#00f2ff]/5 shadow-[0_0_12px_rgba(0,242,255,0.1)]"
										: "border-line/60 bg-[#040814]/30 hover:border-palm/50 hover:bg-[#040814]/60"
								}`}
							>
								<div className="flex items-start justify-between gap-2">
									<h3 className="font-sans text-xs font-bold text-sea-ink group-hover:text-[#00f2ff] transition-colors">
										{asset.title}
									</h3>
									<MapPin className="h-3.5 w-3.5 text-[#00f2ff] shrink-0" />
								</div>
								<p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
									{asset.description}
								</p>
								<div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground font-mono">
									<span>Lat: {asset.lat.toFixed(4)}</span>
									<span className="text-line/40">|</span>
									<span>Lng: {asset.lng.toFixed(4)}</span>
								</div>

								{/* Assigned Tags in List View */}
								{asset.tags && asset.tags.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-2">
										{asset.tags.map((tag) => {
											const displayColor = tag.color || "#00f2ff";
											return (
												<span
													key={tag.id}
													className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border"
													style={{
														backgroundColor: `${displayColor}12`,
														borderColor: `${displayColor}30`,
														color: displayColor,
													}}
												>
													{tag.name}
												</span>
											);
										})}
									</div>
								)}
							</button>
						))
					)}
				</div>

				{/* Note Detail Panel */}
				{selectedMarker && (
					<div className="p-4 border-t border-line bg-surface/90 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-200 shrink-0">
						<div className="flex items-start justify-between gap-2">
							<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-semibold">
								Note Details
							</span>
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={() => setSelectedMarker(null)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>

						<h2 className="font-sans text-sm font-bold text-sea-ink mt-1">
							{selectedMarker.title}
						</h2>
						{selectedMarker.description && (
							<Markdown
								content={selectedMarker.description}
								className="text-xs text-muted-foreground leading-relaxed mt-1.5"
							/>
						)}

						{/* Assigned Tags in Detail Panel */}
						{selectedMarker.tags && selectedMarker.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-3">
								{selectedMarker.tags.map((tag) => {
									const displayColor = tag.color || "#00f2ff";
									return (
										<span
											key={tag.id}
											className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border"
											style={{
												backgroundColor: `${displayColor}12`,
												borderColor: `${displayColor}35`,
												color: displayColor,
											}}
										>
											{tag.name}
										</span>
									);
								})}
							</div>
						)}

						{/* Metadata */}
						{selectedMarker.metadata && (
							<div className="mt-3 text-[10px] space-y-1 font-mono text-muted-foreground">
								<div>Created: {String(selectedMarker.metadata.created)}</div>
								<div>
									Lat / Lng: {selectedMarker.lat.toFixed(6)},{" "}
									{selectedMarker.lng.toFixed(6)}
								</div>
							</div>
						)}

						<div className="mt-3 flex gap-2">
							<Button
								variant="outline"
								size="xs"
								onClick={() => {
									if (map) {
										map.flyTo([selectedMarker.lat, selectedMarker.lng], 16, {
											animate: true,
											duration: 0.8,
										});
									}
								}}
							>
								Zoom
							</Button>
							<Link
								to="/notes/$id"
								params={{ id: String(selectedMarker.id) }}
								className="flex-1"
							>
								<Button
									variant="outline"
									size="xs"
								>
									Details
								</Button>
							</Link>
							<Button
								variant="ghost"
								size="xs"
								onClick={() => setSelectedMarker(null)}
							>
								Close
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Map Container Area */}
			<div className="flex-1 h-full min-h-0 relative">
				<MapContainer center={defaultCenter} zoom={1}>
					<TileLayer />
					<MarkerLayer data={filteredAssets} />
					<MapClickHandler onMapClick={handleMapClick} />

					<MapSearch onCreateNote={handleMapClick} />
					<MapControls />
				</MapContainer>
			</div>

			{/* Create Note Modal Overlay */}
			<CreateNoteModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				defaultLat={clickedCoordinates?.lat}
				defaultLng={clickedCoordinates?.lng}
			/>
		</div>
	);
}

export function MapViewContent() {
	return (
		<MapProvider>
			<MapInnerView />
		</MapProvider>
	);
}
export default MapViewContent;
