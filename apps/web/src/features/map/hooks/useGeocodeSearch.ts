import * as React from "react";
import {
	type GeocodeResult,
	geocodeSearch,
} from "#/features/map/lib/geocode.ts";

const SEARCH_DEBOUNCE_MS = 500;

export type UseGeocodeSearchResult = {
	query: string;
	setQuery: (query: string) => void;
	results: GeocodeResult[];
	loading: boolean;
	error: string | null;
};

/**
 * Debounced address/place search backed by the Photon geocoding API
 * (`geocodeSearch`), called directly from the browser (Photon sends proper
 * CORS headers, unlike Nominatim). Cancels the in-flight request whenever
 * the query changes before it resolves. Reusable anywhere an address search
 * box is needed (see `LocationSearchBar` for the ready-made UI built on top
 * of this hook).
 */
export function useGeocodeSearch(): UseGeocodeSearchResult {
	const [query, setQuery] = React.useState("");
	const [results, setResults] = React.useState<GeocodeResult[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const trimmed = query.trim();
		if (!trimmed) {
			setResults([]);
			setLoading(false);
			setError(null);
			return;
		}

		const controller = new AbortController();
		setLoading(true);
		setError(null);
		const timeout = setTimeout(async () => {
			try {
				const found = await geocodeSearch(trimmed, controller.signal);
				setResults(found);
			} catch (err) {
				if (controller.signal.aborted) return;
				console.error("Address search failed:", err);
				setError("Search failed. Try again.");
				setResults([]);
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		}, SEARCH_DEBOUNCE_MS);

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [query]);

	return { query, setQuery, results, loading, error };
}
