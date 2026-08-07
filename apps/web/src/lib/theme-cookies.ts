import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
	COLOR_THEME_COOKIE,
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	DEFAULT_THEME_MODE,
	isColorTheme,
	isThemeMode,
	THEME_MODE_COOKIE,
	type ThemeMode,
} from "./theme";

export type ThemeCookies = {
	mode: ThemeMode;
	colorTheme: ColorTheme;
};

/**
 * Reads the persisted theme preferences from the request cookies so the
 * server can render the correct theme on the very first paint (no flash of
 * the wrong theme for `light`/`dark` picks).
 */
export const getThemeCookies = createServerFn({ method: "GET" }).handler(
	async (): Promise<ThemeCookies> => {
		const rawMode = getCookie(THEME_MODE_COOKIE);
		const rawColorTheme = getCookie(COLOR_THEME_COOKIE);

		return {
			mode: isThemeMode(rawMode) ? rawMode : DEFAULT_THEME_MODE,
			colorTheme: isColorTheme(rawColorTheme)
				? rawColorTheme
				: DEFAULT_COLOR_THEME,
		};
	},
);
