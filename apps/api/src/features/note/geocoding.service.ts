import { Injectable } from '@nestjs/common';

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
    name || [street, housenumber].filter(Boolean).join(' '),
    city,
    state,
    country,
  ].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(', ') : 'Unknown place';
}

/**
 * Resolves free-text addresses to map coordinates server-side using
 * Komoot's free Photon geocoding API (https://photon.komoot.io), built on
 * OpenStreetMap data. No API key required. Mirrors the client-side geocoder
 * used for interactive location search (`apps/web/src/features/map/lib/geocode.ts`),
 * but is called here to automatically resolve `'address'`-type notes on
 * create/update rather than for interactive search-as-you-type.
 */
@Injectable()
export class GeocodingService {
  /**
   * Resolves a free-text address query to its best-matching coordinates,
   * or `null` if no match was found. Throws if the request itself fails
   * (network error, non-OK response) — callers are expected to catch this
   * and degrade gracefully rather than fail the whole operation.
   */
  async resolve(query: string): Promise<GeocodeResult | null> {
    const trimmed = query.trim();
    if (!trimmed) {
      return null;
    }

    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Geocoding request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as PhotonResponse;
    const [feature] = data.features;
    if (!feature) {
      return null;
    }

    return {
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
      label: labelForFeature(feature),
    };
  }
}
