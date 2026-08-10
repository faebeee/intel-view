import L from "leaflet";

/** Fallback color used for markers whose note has no tags (or unmapped tag colors). */
export const DEFAULT_MARKER_COLOR = "#00f2ff";

const ICON_SIZE = 22;
const ICON_ANCHOR: [number, number] = [ICON_SIZE / 2, ICON_SIZE / 2];
const POPUP_ANCHOR: [number, number] = [0, -ICON_SIZE / 2];

const iconCache = new Map<string, L.DivIcon>();

/** Builds the CSS `background` value for a marker: a solid color for one tag, a diagonal gradient across all assigned tag colors otherwise. */
function buildGradient(colors: string[]): string {
	if (colors.length <= 1) {
		return colors[0] ?? DEFAULT_MARKER_COLOR;
	}
	return `linear-gradient(135deg, ${colors.join(", ")})`;
}

/**
 * Returns a round, pulsating `L.divIcon` colored with the given tag color(s),
 * replacing Leaflet's default pin marker. Multiple colors are rendered as a
 * gradient across the marker/pulse. Icons are cached per unique color
 * combination since they're purely CSS-driven (no per-instance state).
 */
export function getTagMarkerIcon(colors: string[]): L.DivIcon {
	const resolvedColors = colors.length > 0 ? colors : [DEFAULT_MARKER_COLOR];
	const key = resolvedColors.join("|");

	const cached = iconCache.get(key);
	if (cached) return cached;

	const gradient = buildGradient(resolvedColors);
	const icon = L.divIcon({
		className: "tag-marker-icon-wrapper",
		html: `<div class="tag-marker" style="--marker-gradient: ${gradient}"><div class="tag-marker__pulse"></div><div class="tag-marker__dot"></div></div>`,
		iconSize: [ICON_SIZE, ICON_SIZE],
		iconAnchor: ICON_ANCHOR,
		popupAnchor: POPUP_ANCHOR,
	});

	iconCache.set(key, icon);
	return icon;
}
