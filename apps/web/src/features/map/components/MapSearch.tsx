import L from "leaflet";
import { Compass, Loader2, MapPin, Plus, Search, X } from "lucide-react";
import * as React from "react";
import { Marker, Tooltip, useMap as useReactLeafletMap } from "react-leaflet";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";

type GeocodingResult = {
	place_id: number;
	display_name: string;
	lat: string;
	lon: string;
};

// Custom icon for the geocoded address target pin (neon orange/yellow target)
const createTargetIcon = () => {
	return L.divIcon({
		className: "custom-target-marker",
		html: `
			<div class="relative flex items-center justify-center w-8 h-8">
				<span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-amber-500 opacity-40"></span>
				<span class="absolute inline-flex h-5 w-5 rounded-full border border-amber-500 bg-amber-500/10"></span>
				<span class="relative inline-flex h-3 w-3 rounded-full bg-amber-500 border-2 border-white shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
			</div>
		`,
		iconSize: [32, 32],
		iconAnchor: [16, 16],
	});
};

type MapSearchProps = {
	onCreateNote?: (lat: number, lng: number) => void;
};

export function MapSearch({ onCreateNote }: MapSearchProps) {
	const leafletMap = useReactLeafletMap();
	const [query, setQuery] = React.useState("");
	const [results, setResults] = React.useState<GeocodingResult[]>([]);
	const [selectedTarget, setSelectedTarget] =
		React.useState<GeocodingResult | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [showDropdown, setShowDropdown] = React.useState(false);
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	// Fetch address results from Nominatim OSM Geocoding API (debounced)
	React.useEffect(() => {
		if (query.trim().length < 3) {
			setResults([]);
			return;
		}

		const delayDebounce = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await fetch(
					`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
					{
						headers: {
							"User-Agent": "Intel-View-App/1.0 (Location Notes Manager)",
						},
					},
				);
				if (res.ok) {
					const data = await res.json();
					setResults(data);
					setShowDropdown(true);
				}
			} catch (err) {
				console.error("Geocoding fetch failed:", err);
			} finally {
				setLoading(false);
			}
		}, 500);

		return () => clearTimeout(delayDebounce);
	}, [query]);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setShowDropdown(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Disable click and scroll propagation to the underlying map
	React.useEffect(() => {
		if (dropdownRef.current) {
			L.DomEvent.disableClickPropagation(dropdownRef.current);
			L.DomEvent.disableScrollPropagation(dropdownRef.current);
		}
	}, []);

	const handleSelectResult = (result: GeocodingResult) => {
		const lat = parseFloat(result.lat);
		const lon = parseFloat(result.lon);

		setSelectedTarget(result);
		setShowDropdown(false);
		setQuery("");

		// Fly to the geocoded address
		leafletMap.flyTo([lat, lon], 15, {
			animate: true,
			duration: 1.2,
		});
	};

	const handleClearTarget = () => {
		setSelectedTarget(null);
	};

	return (
		<>
			{/* Floating Geocoding Search Panel */}
			<div
				ref={dropdownRef}
				className="absolute left-4 top-4 z-1000 w-72 sm:w-80 md:w-96 flex flex-col gap-1.5"
			>
				<div className="relative flex items-center bg-surface-strong/95 border border-line rounded-lg backdrop-blur-md shadow-lg shadow-black/40 p-1">
					<Search className="absolute left-3.5 h-4 w-4 text-[#00f2ff] pointer-events-none" />
					<Input
						type="text"
						placeholder="Search any address / location..."
						className="pl-9 pr-8 bg-transparent border-none text-xs text-sea-ink h-8 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-none shadow-none"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setShowDropdown(true);
						}}
						onFocus={() => setShowDropdown(true)}
					/>
					{loading && (
						<Loader2 className="absolute right-3.5 h-4 w-4 animate-spin text-palm" />
					)}
					{!loading && (query || selectedTarget) && (
						<button
							type="button"
							className="absolute right-3 p-1 text-muted-foreground hover:text-red-400 rounded-full hover:bg-line/20"
							onClick={() => {
								setQuery("");
								setResults([]);
								handleClearTarget();
							}}
						>
							<X className="h-3 w-3" />
						</button>
					)}
				</div>

				{/* Suggestions Dropdown */}
				{showDropdown && results.length > 0 && (
					<div className="bg-surface-strong/95 border border-line rounded-lg backdrop-blur-md shadow-xl shadow-black/50 overflow-hidden divide-y divide-line/40 animate-in fade-in slide-in-from-top duration-150">
						{results.map((result) => (
							<button
								key={result.place_id}
								type="button"
								className="w-full p-2.5 text-left text-xs text-sea-ink hover:bg-line/20 hover:text-[#00f2ff] transition-all flex items-start gap-2"
								onClick={() => handleSelectResult(result)}
							>
								<MapPin className="h-3.5 w-3.5 shrink-0 text-palm mt-0.5" />
								<span className="leading-normal line-clamp-2">
									{result.display_name}
								</span>
							</button>
						))}
					</div>
				)}

				{/* Floating indicator when target selected */}
				{selectedTarget && (
					<div className="bg-[#f59e0b]/10 border border-amber-500/30 rounded-lg p-2 flex items-start justify-between gap-2 shadow-lg shadow-black/30 backdrop-blur-sm animate-in fade-in duration-200">
						<div className="flex gap-1.5 min-w-0">
							<Compass className="h-4 w-4 text-amber-500 shrink-0 mt-0.5 animate-spin-slow" />
							<div className="min-w-0">
								<span className="text-[10px] tracking-wider font-bold text-amber-400 uppercase block leading-none">
									Selected Location
								</span>
								<span className="text-[9px] text-sea-ink-soft leading-tight line-clamp-1 block mt-0.5">
									{selectedTarget.display_name}
								</span>
							</div>
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							{onCreateNote && (
								<Button
									variant="outline"
									size="xs"
									onClick={() => {
										onCreateNote(
											parseFloat(selectedTarget.lat),
											parseFloat(selectedTarget.lon),
										);
									}}
									className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-bold text-[9px] uppercase tracking-wider h-6 px-2"
								>
									<Plus className="h-3 w-3" />
									<span>Add Note</span>
								</Button>
							)}
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={handleClearTarget}
							>
								<X className="h-3 w-3" />
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Render Temporary Target Marker if locked */}
			{selectedTarget && (
				<Marker
					position={[
						parseFloat(selectedTarget.lat),
						parseFloat(selectedTarget.lon),
					]}
					icon={createTargetIcon()}
				>
					<Tooltip
						direction="top"
						offset={[0, -10]}
						className="bg-amber-500 border border-amber-600 text-black font-bold rounded px-2 py-0.5 text-xs shadow-md font-sans"
					>
						Selected Location
					</Tooltip>
				</Marker>
			)}
		</>
	);
}
