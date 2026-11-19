import { describe, expect, it } from "vitest";
import {
	APP_THEMES,
	isThemePreference,
	resolveTheme,
	themeFromLegacyMode,
} from "./theme.ts";

describe("resolveTheme", () => {
	it("returns the chosen theme regardless of the OS preference", () => {
		expect(resolveTheme("phosphor", false).id).toBe("phosphor");
		expect(resolveTheme("paper", true).id).toBe("paper");
	});

	it("follows the OS light/dark preference for 'system'", () => {
		expect(resolveTheme("system", true).id).toBe("terminal");
		expect(resolveTheme("system", false).id).toBe("daylight");
	});
});

describe("themeFromLegacyMode", () => {
	it("maps the old light/dark/system cookie values", () => {
		expect(themeFromLegacyMode("dark")).toBe("terminal");
		expect(themeFromLegacyMode("light")).toBe("daylight");
		expect(themeFromLegacyMode("system")).toBe("system");
		expect(themeFromLegacyMode(undefined)).toBeUndefined();
	});
});

describe("isThemePreference", () => {
	it("accepts 'system' and every app theme, rejects anything else", () => {
		expect(isThemePreference("system")).toBe(true);
		for (const theme of APP_THEMES) {
			expect(isThemePreference(theme.id)).toBe(true);
		}
		expect(isThemePreference("dark")).toBe(false);
		expect(isThemePreference(undefined)).toBe(false);
	});
});

describe("APP_THEMES", () => {
	it("has unique ids and both a dark and a light option", () => {
		const ids = APP_THEMES.map((theme) => theme.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(APP_THEMES.some((theme) => theme.scheme === "dark")).toBe(true);
		expect(APP_THEMES.some((theme) => theme.scheme === "light")).toBe(true);
	});
});
