import type { JSX, ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	resolveModeClass,
	THEME_MODE_COOKIE,
	type ThemeMode,
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

type ThemeProviderProps = {
	children: ReactNode;
	initialMode: ThemeMode;
};

type ThemeProviderState = {
	mode: ThemeMode;
	resolvedMode: "light" | "dark";
	setMode: (mode: ThemeMode) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
	undefined,
);

export function ThemeProvider({
	children,
	initialMode,
}: ThemeProviderProps): JSX.Element {
	const [mode, setModeState] = useState<ThemeMode>(initialMode);

	const applyMode = useCallback((nextMode: ThemeMode) => {
		const root = document.documentElement;
		const className = resolveModeClass(nextMode, getPrefersDark());
		root.classList.toggle("dark", className === "dark");
	}, []);

	const setMode = useCallback(
		(nextMode: ThemeMode) => {
			setModeState(nextMode);
			setCookie(THEME_MODE_COOKIE, nextMode);
			applyMode(nextMode);
		},
		[applyMode],
	);

	// Correct the DOM after hydration in case the server's guess for
	// "system" mode didn't match this client's actual OS preference.
	useEffect(() => {
		applyMode(mode);
	}, [mode, applyMode]);

	// Keep the DOM in sync with `mode` when relying on the OS preference.
	useEffect(() => {
		if (mode !== "system") return;

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (): void => applyMode("system");
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, [mode, applyMode]);

	const resolvedMode: "light" | "dark" =
		mode === "system"
			? getPrefersDark()
				? "dark"
				: "light"
			: (mode as "light" | "dark");

	return (
		<ThemeProviderContext.Provider value={{ mode, resolvedMode, setMode }}>
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
