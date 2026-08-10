export type GeocodeResult = {
	lat: number;
	lng: number;
	label: string;
};

type PhotonFeature = {
	geometry: { coordinates: [number, number] };
	properties: {
		name?: string;
		street?: string;
		housenumber?: string;
		city?: string;
		state?: string;
		country?: string;
	};
};

type PhotonResponse = {
	features: PhotonFeature[];
};

/** Builds a human-readable label from a Photon feature's address parts, e.g. "Eiffel Tower, Paris, Île-de-France, France". */
function labelForFeature(feature: PhotonFeature): string {
	const { name, street, housenumber, city, state, country } =
		feature.properties;
	const parts = [
		name || [street, housenumber].filter(Boolean).join(" "),
		city,
		state,
		country,
	].filter((part): part is string => Boolean(part?.trim()));
	return parts.length > 0 ? parts.join(", ") : "Unknown place";
}

/**
 * Searches for a place by free-text query using Komoot's free Photon
 * geocoding API (https://photon.komoot.io), which is built on OpenStreetMap
 * data like Nominatim but — unlike Nominatim — sends proper CORS headers,
 * so it can be called directly from the browser without a server-side
 * proxy. Client-side, low-volume, debounced use is expected (see
 * `useGeocodeSearch`).
 */
export async function geocodeSearch(
	query: string,
	signal?: AbortSignal,
): Promise<GeocodeResult[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const url = new URL("https://photon.komoot.io/api/");
	url.searchParams.set("q", trimmed);
	url.searchParams.set("limit", "6");

	const response = await fetch(url.toString(), { signal });
	if (!response.ok) {
		throw new Error(`Geocoding search failed with status ${response.status}`);
	}

	const data = (await response.json()) as PhotonResponse;
	return data.features.map((feature) => ({
		lat: feature.geometry.coordinates[1],
		lng: feature.geometry.coordinates[0],
		label: labelForFeature(feature),
	}));
}
