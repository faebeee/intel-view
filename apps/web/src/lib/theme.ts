/**
 * Shared theme constants and helpers.
 *
 * Two independent axes are supported:
 * - `mode`: light / dark / system — toggles the `.dark` class on <html>.
 * - `colorTheme`: which color palette to use — toggles a `data-theme`
 *   attribute on <html> (see the `[data-theme="..."]` blocks in styles.css).
 */

export type ThemeMode = "light" | "dark" | "system";

export type ColorTheme = "ocean" | "emerald" | "violet";

export const THEME_MODES: ThemeMode[] = ["light", "dark", "system"];

export const COLOR_THEMES: ColorTheme[] = ["ocean", "emerald", "violet"];

export const DEFAULT_THEME_MODE: ThemeMode = "dark";

export const DEFAULT_COLOR_THEME: ColorTheme = "ocean";

export const THEME_MODE_COOKIE = "theme-mode";

export const COLOR_THEME_COOKIE = "theme-color";

export const COLOR_THEME_LABELS: Record<ColorTheme, string> = {
	ocean: "Ocean",
	emerald: "Emerald",
	violet: "Violet",
};

export function isThemeMode(value: string | undefined): value is ThemeMode {
	return !!value && (THEME_MODES as string[]).includes(value);
}

export function isColorTheme(
	value: string | undefined,
): value is ColorTheme {
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
