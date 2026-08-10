import { Loader2, MapPin, Search } from "lucide-react";
import * as React from "react";
import { Input } from "#/components/ui/input.tsx";
import { useGeocodeSearch } from "#/features/map/hooks/useGeocodeSearch.ts";
import type { GeocodeResult } from "#/features/map/lib/geocode.ts";

export type LocationSearchBarProps = {
	onSelect: (result: GeocodeResult) => void;
	placeholder?: string;
	className?: string;
};

/**
 * Address/place search bar backed by OpenStreetMap's Nominatim API
 * (via `useGeocodeSearch`), debounced to respect its usage policy.
 * Reusable anywhere a "search for a place" input is needed — e.g. inside
 * `LocationPickerDialog`, or standalone next to a read-only map.
 */
export function LocationSearchBar({
	onSelect,
	placeholder = "Search for an address or place...",
	className,
}: LocationSearchBarProps) {
	const { query, setQuery, results, loading, error } = useGeocodeSearch();
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		if (query.trim().length > 0) setOpen(true);
	}, [query]);

	return (
		<div className={className ?? "relative w-full max-w-xl"}>
			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					onFocus={() => results.length > 0 && setOpen(true)}
					placeholder={placeholder}
					className="pl-9 pr-9"
				/>
				{loading && (
					<Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
				)}
			</div>
			{open && query.trim().length > 0 && (
				<div className="absolute z-[1200] mt-1 w-full overflow-hidden rounded-md border border-line/45 bg-popover shadow-lg">
					{error && (
						<p className="px-3 py-2 text-xs text-destructive">{error}</p>
					)}
					{!error && !loading && results.length === 0 && (
						<p className="px-3 py-2 text-xs text-muted-foreground">
							No places found.
						</p>
					)}
					{!error && results.length > 0 && (
						<ul className="max-h-64 overflow-y-auto">
							{results.map((result) => (
								<li key={`${result.lat},${result.lng},${result.label}`}>
									<button
										type="button"
										className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent/15"
										onClick={() => {
											onSelect(result);
											setQuery(result.label);
											setOpen(false);
										}}
									>
										<MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palm" />
										<span className="truncate">{result.label}</span>
									</button>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
