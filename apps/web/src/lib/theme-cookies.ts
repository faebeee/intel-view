import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
	DEFAULT_THEME_PREFERENCE,
	isThemePreference,
	LEGACY_THEME_MODE_COOKIE,
	THEME_COOKIE,
	type ThemePreference,
	themeFromLegacyMode,
} from "./theme";

export type ThemeCookies = {
	theme: ThemePreference;
};

/**
 * Reads the persisted app theme preference from the request cookies so the
 * server can render the correct theme on the very first paint (no flash of
 * the wrong theme). Falls back to the legacy light/dark/system mode cookie.
 */
export const getThemeCookies = createServerFn({ method: "GET" }).handler(
	async (): Promise<ThemeCookies> => {
		const rawTheme = getCookie(THEME_COOKIE);
		if (isThemePreference(rawTheme)) return { theme: rawTheme };

		return {
			theme:
				themeFromLegacyMode(getCookie(LEGACY_THEME_MODE_COOKIE)) ??
				DEFAULT_THEME_PREFERENCE,
		};
	},
);
