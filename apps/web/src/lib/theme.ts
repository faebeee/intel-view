/**
 * Shared theme constants and helpers.
 *
 * Two independent axes are supported:
 * - `mode`: light / dark / system — toggles the `.dark` class on <html>.
 * - `colorTheme`: which color palette to use — toggles a `data-theme`
 *   attribute on <html> (see the `[data-theme="..."]` blocks in styles.css).
 *   Unlike `mode`, this is not a global user preference: it's driven by the
 *   currently open project's `color` field (see
 *   `apps/web/src/features/common/components/Layout.tsx`), so opening a
 *   project applies its chosen accent color for the duration of the visit.
 */

export type ThemeMode = "light" | "dark" | "system";

export type ColorTheme =
	| "ocean"
	| "emerald"
	| "violet"
	| "monochrome"
	| "crimson"
	| "amber";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export const COLOR_THEMES: ColorTheme[] = [
	"ocean",
	"emerald",
	"violet",
	"monochrome",
	"crimson",
	"amber",
];

export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const DEFAULT_COLOR_THEME: ColorTheme = "ocean";

export const THEME_MODE_COOKIE = "theme-mode";

export const COLOR_THEME_LABELS: Record<ColorTheme, string> = {
	ocean: "Ocean",
	emerald: "Emerald",
	violet: "Violet",
	monochrome: "Monochrome",
	crimson: "Crimson",
	amber: "Amber",
};

/** Tailwind background classes used to render a small preview swatch for each palette. */
export const COLOR_THEME_SWATCH: Record<ColorTheme, string> = {
	ocean: "bg-[oklch(0.68_0.18_200)]",
	emerald: "bg-[oklch(0.65_0.19_155)]",
	violet: "bg-[oklch(0.62_0.22_300)]",
	monochrome: "bg-[oklch(0.2_0_0)]",
	crimson: "bg-[oklch(0.6_0.22_20)]",
	amber: "bg-[oklch(0.7_0.18_80)]",
};

export function isThemeMode(value: string | undefined): value is ThemeMode {
	return !!value && (THEME_MODES as string[]).includes(value);
}

export function isColorTheme(value: string | undefined): value is ColorTheme {
	return !!value && (COLOR_THEMES as string[]).includes(value);
}

/**
 * Applies a color palette to the document by setting the `data-theme`
 * attribute on <html>. Used to reflect the currently open project's chosen
 * accent color; falls back to a no-op during SSR.
 */
export function applyColorTheme(theme: ColorTheme): void {
	if (typeof document === "undefined") return;
	document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Resolves a `ThemeMode` (which may be "system") to the concrete class name
 * that should be applied to <html> ("dark" or "" for light). When `mode` is
 * "system" this relies on `prefersDark` (only known on the client).
 */
export function resolveModeClass(
	mode: ThemeMode,
	prefersDark: boolean,
): "dark" | "" {
	if (mode === "system") {
		return prefersDark ? "dark" : "";
	}
	return mode === "dark" ? "dark" : "";
}
