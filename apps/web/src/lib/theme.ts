/**
 * Shared theme constants and helpers.
 *
 * - `mode`: light / dark / system — toggles the `.dark` class on <html>.
 * - `ColorTheme`: a project's `color` field. It no longer recolors the app
 *   (the design has a single global accent); it's shown as the project's
 *   status chip, mapped onto the design's signal colors below.
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

/** Design token (CSS variable) each project color maps onto. */
export const COLOR_THEME_TOKEN: Record<ColorTheme, string> = {
	ocean: "var(--mc-data)",
	emerald: "var(--mc-accent)",
	violet: "var(--mc-service)",
	monochrome: "var(--mc-text-muted)",
	crimson: "var(--mc-danger)",
	amber: "var(--mc-warning)",
};

/** Tailwind background classes used to render a small preview swatch for each palette. */
export const COLOR_THEME_SWATCH: Record<ColorTheme, string> = {
	ocean: "bg-mc-data",
	emerald: "bg-mc-accent",
	violet: "bg-mc-service",
	monochrome: "bg-mc-text-muted",
	crimson: "bg-mc-danger",
	amber: "bg-mc-warning",
};

export function isThemeMode(value: string | undefined): value is ThemeMode {
	return !!value && (THEME_MODES as string[]).includes(value);
}

export function isColorTheme(value: string | undefined): value is ColorTheme {
	return !!value && (COLOR_THEMES as string[]).includes(value);
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
