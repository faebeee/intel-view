import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
	DEFAULT_THEME_MODE,
	isThemeMode,
	THEME_MODE_COOKIE,
	type ThemeMode,
} from "./theme";

export type ThemeCookies = {
	mode: ThemeMode;
};

/**
 * Reads the persisted color mode (light/dark/system) preference from the
 * request cookies so the server can render the correct mode on the very
 * first paint (no flash of the wrong mode). The accent color palette is no
 * longer a cookie-persisted global preference — it's derived per-project
 * (see `Layout`), so it isn't read here.
 */
export const getThemeCookies = createServerFn({ method: "GET" }).handler(
	async (): Promise<ThemeCookies> => {
		const rawMode = getCookie(THEME_MODE_COOKIE);

		return {
			mode: isThemeMode(rawMode) ? rawMode : DEFAULT_THEME_MODE,
		};
	},
);
