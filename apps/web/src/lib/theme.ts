/**
 * Shared theme constants and helpers.
 *
 * - App theme: a complete look (see `APP_THEMES`), applied as
 *   `data-theme` on <html> plus the `.dark` class for dark-based themes.
 *   The preference may be "system" (follow the OS light/dark setting).
 * - `ColorTheme`: a project's `color` field. It no longer recolors the app
 *   (the design has a single global accent); it's shown as the project's
 *   status chip, mapped onto the design's signal colors below.
 */

/** Concrete app-wide looks. Each one is built on either the dark or light base. */
export type AppThemeId =
	| "terminal"
	| "midnight"
	| "phosphor"
	| "contrast"
	| "daylight"
	| "paper";

/** A user's theme choice: a concrete theme, or follow the OS light/dark preference. */
export type ThemePreference = AppThemeId | "system";

export type ColorScheme = "light" | "dark";

export type AppThemeDefinition = {
	id: AppThemeId;
	label: string;
	description: string;
	/** Base the theme builds on: toggles the `.dark` class on <html>. */
	scheme: ColorScheme;
	/** Preview swatch colours for the picker: background and accent. */
	swatch: { bg: string; accent: string };
};

/** All app themes, dark first. Their tokens live in `styles.css` (`[data-theme]`). */
export const APP_THEMES: AppThemeDefinition[] = [
	{
		id: "terminal",
		label: "Terminal",
		description: "Near-black with a lime accent",
		scheme: "dark",
		swatch: { bg: "#07090b", accent: "#c6ff3d" },
	},
	{
		id: "midnight",
		label: "Midnight",
		description: "Deep navy with a cyan accent",
		scheme: "dark",
		swatch: { bg: "#070b14", accent: "#5cc8ff" },
	},
	{
		id: "phosphor",
		label: "Phosphor",
		description: "Amber CRT glow",
		scheme: "dark",
		swatch: { bg: "#0a0703", accent: "#ffb000" },
	},
	{
		id: "contrast",
		label: "High Contrast",
		description: "Pure black, white text, yellow accent",
		scheme: "dark",
		swatch: { bg: "#000000", accent: "#ffe600" },
	},
	{
		id: "daylight",
		label: "Daylight",
		description: "Cool light blue-grey",
		scheme: "light",
		swatch: { bg: "#f8fafc", accent: "#0e7490" },
	},
	{
		id: "paper",
		label: "Paper",
		description: "Warm cream with a terracotta accent",
		scheme: "light",
		swatch: { bg: "#f6f1e7", accent: "#a3461f" },
	},
];

export const THEME_PREFERENCES: ThemePreference[] = [
	"system",
	...APP_THEMES.map((theme) => theme.id),
];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "terminal";

/** Themes used for the "system" preference. */
export const SYSTEM_THEMES: Record<ColorScheme, AppThemeId> = {
	dark: "terminal",
	light: "daylight",
};

export const THEME_COOKIE = "app-theme";

/** Pre-themes cookie (light/dark/system), still honoured when no theme is set. */
export const LEGACY_THEME_MODE_COOKIE = "theme-mode";

export function isThemePreference(
	value: string | undefined,
): value is ThemePreference {
	return !!value && (THEME_PREFERENCES as string[]).includes(value);
}

/** Maps the legacy light/dark/system mode cookie onto a theme preference. */
export function themeFromLegacyMode(
	value: string | undefined,
): ThemePreference | undefined {
	if (value === "dark") return "terminal";
	if (value === "light") return "daylight";
	if (value === "system") return "system";
	return undefined;
}

export function findAppTheme(id: AppThemeId): AppThemeDefinition {
	return APP_THEMES.find((theme) => theme.id === id) ?? APP_THEMES[0];
}

/**
 * Resolves a preference (which may be "system") to a concrete theme.
 * `prefersDark` is only known on the client; the server assumes dark.
 */
export function resolveTheme(
	preference: ThemePreference,
	prefersDark: boolean,
): AppThemeDefinition {
	if (preference === "system") {
		return findAppTheme(SYSTEM_THEMES[prefersDark ? "dark" : "light"]);
	}
	return findAppTheme(preference);
}

export type ColorTheme =
	| "ocean"
	| "emerald"
	| "violet"
	| "monochrome"
	| "crimson"
	| "amber";

export const COLOR_THEMES: ColorTheme[] = [
	"ocean",
	"emerald",
	"violet",
	"monochrome",
	"crimson",
	"amber",
];

export const DEFAULT_COLOR_THEME: ColorTheme = "ocean";

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

export function isColorTheme(value: string | undefined): value is ColorTheme {
	return !!value && (COLOR_THEMES as string[]).includes(value);
}
