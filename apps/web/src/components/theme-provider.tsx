import type { JSX, ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	type AppThemeDefinition,
	type ColorScheme,
	resolveTheme,
	THEME_COOKIE,
	type ThemePreference,
} from "#/lib/theme";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setCookie(name: string, value: string): void {
	if (typeof document === "undefined") return;
	document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

function getPrefersDark(): boolean {
	if (typeof window === "undefined") return true;
	return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies a resolved theme to <html>: `data-theme` plus the `.dark` class. */
function applyTheme(theme: AppThemeDefinition): void {
	const root = document.documentElement;
	root.dataset.theme = theme.id;
	root.classList.toggle("dark", theme.scheme === "dark");
}

type ThemeProviderProps = {
	children: ReactNode;
	initialTheme: ThemePreference;
};

type ThemeProviderState = {
	/** The user's choice, possibly "system". */
	preference: ThemePreference;
	/** The concrete theme currently applied. */
	theme: AppThemeDefinition;
	/** Light/dark base of the applied theme (for libraries with a color mode). */
	resolvedMode: ColorScheme;
	setPreference: (preference: ThemePreference) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
	undefined,
);

export function ThemeProvider({
	children,
	initialTheme,
}: ThemeProviderProps): JSX.Element {
	const [preference, setPreferenceState] =
		useState<ThemePreference>(initialTheme);
	const [prefersDark, setPrefersDark] = useState<boolean>(getPrefersDark);

	const theme = resolveTheme(preference, prefersDark);

	const setPreference = useCallback((next: ThemePreference) => {
		setPreferenceState(next);
		setCookie(THEME_COOKIE, next);
	}, []);

	// Keep <html> in sync; also corrects the server's guess for "system".
	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	// Follow OS light/dark changes while the preference is "system".
	useEffect(() => {
		if (preference !== "system") return;
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		setPrefersDark(media.matches);
		const handleChange = (): void => setPrefersDark(media.matches);
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, [preference]);

	return (
		<ThemeProviderContext.Provider
			value={{
				preference,
				theme,
				resolvedMode: theme.scheme,
				setPreference,
			}}
		>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export function useTheme(): ThemeProviderState {
	const context = useContext(ThemeProviderContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
