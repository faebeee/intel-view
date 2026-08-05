import {
	Activity,
	AlertTriangle,
	Compass,
	Eye,
	MapPin,
	RefreshCw,
	Search,
	ShieldAlert,
	X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { useMap } from "../hooks/useMap";
import { useNotesQuery } from "../hooks/useNotesQuery";
import type { Coordinate, MapMarkerData } from "../types";
import { MapContainer } from "./MapContainer";
import { MapControls } from "./MapControls";
import { MapProvider } from "./MapProvider";
import { MarkerLayer } from "./MarkerLayer";
import { TileLayer } from "./TileLayer";

type CategoryFilter = "all" | "note";

function MapInnerView() {
	const { map, selectedMarker, setSelectedMarker } = useMap();
	const { data: notes = [], isLoading, error, refetch } = useNotesQuery();
	const [searchQuery, setSearchQuery] = React.useState("");
	const [selectedCategory, setSelectedCategory] =
		React.useState<CategoryFilter>("all");

	// Center point defaulted to Munich, or dynamically focus on first note if available
	const defaultCenter: Coordinate = React.useMemo(() => {
		if (notes.length > 0) {
			return [notes[0].lat, notes[0].lng];
		}
		return [48.1351, 11.582];
	}, [notes]);

	// Filter notes based on search query and category
	const filteredAssets = React.useMemo(() => {
		return notes.filter((asset) => {
			const matchesSearch =
				asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
					false);

			const matchesCategory =
				selectedCategory === "all" || asset.category === selectedCategory;

			return matchesSearch && matchesCategory;
		});
	}, [notes, searchQuery, selectedCategory]);

	const handleFocusAsset = (asset: MapMarkerData) => {
		setSelectedMarker(asset);
		if (map) {
			map.flyTo([asset.lat, asset.lng], 15, {
				animate: true,
				duration: 0.8,
			});
		}
	};

	const getCategoryIcon = (category?: string) => {
		switch (category) {
			case "active":
				return <Activity className="h-3.5 w-3.5 text-emerald-400" />;
			case "intel":
				return <Compass className="h-3.5 w-3.5 text-sky-400" />;
			case "danger":
				return <ShieldAlert className="h-3.5 w-3.5 text-red-500" />;
			case "warning":
				return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
			default:
				return <MapPin className="h-3.5 w-3.5 text-[#00f2ff]" />;
		}
	};

	const getCategoryColorClass = (category?: string) => {
		switch (category) {
			case "active":
				return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
			case "intel":
				return "border-sky-500/30 text-sky-400 bg-sky-500/10";
			case "danger":
				return "border-red-500/30 text-red-400 bg-red-500/10";
			case "warning":
				return "border-amber-500/30 text-amber-400 bg-amber-500/10";
			default:
				return "border-[#00f2ff]/30 text-[#00f2ff] bg-[#00f2ff]/10";
		}
	};

	if (isLoading) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center bg-[#030712] font-mono text-xs text-[#00f2ff] gap-3">
				<RefreshCw className="h-6 w-6 animate-spin text-palm" />
				<span>DOWNLOADING GEOSPATIAL DATABASE...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center bg-[#030712] font-mono text-xs text-red-400 p-6 text-center gap-3">
				<ShieldAlert className="h-8 w-8 text-red-500" />
				<span className="font-bold">CONNECTION TO SATELLITE API FAILED</span>
				<p className="max-w-xs text-[10px] text-muted-foreground">
					{error instanceof Error
						? error.message
						: "An unknown decryption error occurred."}
				</p>
				<Button
					variant="outline"
					size="xs"
					className="mt-2 border-red-500/40 text-red-400 hover:bg-red-500/15"
					onClick={() => refetch()}
				>
					Retry Connection
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col md:flex-row h-full w-full min-h-0 divide-y md:divide-y-0 md:divide-x divide-line bg-background">
			{/* Left Sidebar Control Panel */}
			<div className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 bg-surface-strong/95 backdrop-blur-md z-10 overflow-hidden">
				{/* Sidebar Header */}
				<div className="p-4 border-b border-line flex flex-col gap-1.5 shrink-0">
					<div className="flex items-center justify-between">
						<span className="island-kicker text-[10px] tracking-widest text-[#00f2ff]">
							Surveillance Terminal
						</span>
						<Button
							variant="ghost"
							size="icon-xs"
							className="h-5 w-5 text-muted-foreground hover:text-[#00f2ff]"
							onClick={() => refetch()}
							title="Refresh Data"
						>
							<RefreshCw className="h-3 w-3" />
						</Button>
					</div>
					<h1 className="display-title text-xl font-bold text-sea-ink flex items-center gap-2">
						<Eye className="h-5 w-5 text-palm" />
						Operational Map
					</h1>
					<p className="text-xs text-muted-foreground">
						Tactical visualization and tracking of active notes, secure nodes,
						and coordinates.
					</p>
				</div>

				{/* Search & Filter Controls */}
				<div className="p-4 border-b border-line flex flex-col gap-3 shrink-0 bg-surface">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search tactical sectors..."
							className="pl-9 bg-[#040814]/60 border-line text-xs h-9"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{/* Category Tabs */}
					<div className="flex flex-wrap gap-1">
						{(["all", "note"] as CategoryFilter[]).map((cat) => (
							<Button
								key={cat}
								variant={selectedCategory === cat ? "default" : "outline"}
								size="xs"
								onClick={() => setSelectedCategory(cat)}
								className={`text-[10px] capitalize transition-all ${
									selectedCategory === cat
										? "bg-palm text-background border-none shadow-[0_0_8px_rgba(56,189,248,0.5)] font-bold"
										: "bg-surface-strong/50 border-line text-sea-ink-soft hover:border-palm/40 hover:text-[#00f2ff]"
								}`}
							>
								{cat === "all" ? "All Coordinates" : "Sector Notes"}
							</Button>
						))}
					</div>
				</div>

				{/* Location / Assets List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[200px]">
					{filteredAssets.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center p-4">
							<MapPin className="h-8 w-8 text-muted-foreground/30 mb-2" />
							<p className="text-xs text-muted-foreground font-medium">
								No active assets found
							</p>
							<p className="text-[10px] text-muted-foreground/70 mt-1">
								Modify your search or tactical filters.
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
									<span className="shrink-0">
										{getCategoryIcon(asset.category)}
									</span>
								</div>
								<p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">
									{asset.description}
								</p>
								<div className="flex items-center gap-1.5 mt-2 text-[9px] text-muted-foreground font-mono">
									<span>LAT: {asset.lat.toFixed(4)}</span>
									<span className="text-line/40">|</span>
									<span>LNG: {asset.lng.toFixed(4)}</span>
								</div>
							</button>
						))
					)}
				</div>

				{/* Selected Sector Detail Panel */}
				{selectedMarker && (
					<div className="p-4 border-t border-line bg-surface/90 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-200 shrink-0">
						<div className="flex items-start justify-between gap-2">
							<div className="flex items-center gap-1.5">
								<span className="island-kicker text-[9px] tracking-wider text-[#00f2ff]">
									Sector Details
								</span>
								<Badge
									className={`text-[8px] uppercase px-1.5 py-0 border ${getCategoryColorClass(selectedMarker.category)}`}
								>
									{selectedMarker.category || "General"}
								</Badge>
							</div>
							<Button
								variant="ghost"
								size="icon-xs"
								className="h-5 w-5 text-muted-foreground hover:text-sea-ink rounded-full"
								onClick={() => setSelectedMarker(null)}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>

						<h2 className="font-sans text-sm font-extrabold text-sea-ink mt-1">
							{selectedMarker.title}
						</h2>
						<p className="text-xs text-muted-foreground leading-relaxed mt-1.5 whitespace-pre-wrap">
							{selectedMarker.description}
						</p>

						{/* Metadata Grid */}
						{selectedMarker.metadata && (
							<div className="mt-3 p-2 bg-[#040814]/50 border border-line rounded-md text-[10px] space-y-1 font-mono">
								{Object.entries(selectedMarker.metadata).map(([key, val]) => (
									<div key={key} className="flex justify-between gap-2">
										<span className="text-muted-foreground uppercase">
											{key}:
										</span>
										<span className="text-[#00f2ff]">{String(val)}</span>
									</div>
								))}
							</div>
						)}

						<div className="mt-3 flex gap-2">
							<Button
								variant="outline"
								size="xs"
								className="flex-1 text-[10px] border-line hover:border-palm/50 text-sea-ink hover:text-[#00f2ff]"
								onClick={() => {
									if (map) {
										map.flyTo([selectedMarker.lat, selectedMarker.lng], 16, {
											animate: true,
											duration: 0.8,
										});
									}
								}}
							>
								Maximize Zoom
							</Button>
							<Button
								variant="ghost"
								size="xs"
								className="text-[10px] text-muted-foreground hover:text-red-400"
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
				<MapContainer center={defaultCenter} zoom={13}>
					<TileLayer />
					<MarkerLayer data={filteredAssets} />
					<MapControls />
				</MapContainer>
			</div>
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
