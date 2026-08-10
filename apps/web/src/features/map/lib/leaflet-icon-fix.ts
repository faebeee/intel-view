import L from "leaflet";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

let patched = false;

/**
 * Leaflet's default marker icon references image paths that are resolved
 * relative to the CSS file location, which breaks under bundlers like Vite
 * that hash/relocate asset URLs. This resets `L.Icon.Default`'s options to
 * point at the bundler-resolved asset URLs instead, so `<Marker />`s that
 * don't specify a custom `icon` render correctly.
 *
 * Must be called once before any Leaflet map renders a default marker (safe
 * to call multiple times - only patches once). Called automatically by
 * `<LeafletMap />`, so consumers of that component don't need to call this
 * themselves.
 */
export function ensureLeafletDefaultIcon(): void {
	if (patched) return;
	patched = true;

	// biome-ignore lint/suspicious/noExplicitAny: `_getIconUrl` is a private/internal Leaflet API with no public type
	delete (L.Icon.Default.prototype as any)._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: markerIcon2xUrl,
		iconUrl: markerIconUrl,
		shadowUrl: markerShadowUrl,
	});
}
