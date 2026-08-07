import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import type { JSX } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useTheme } from "#/components/theme-provider";
import {
	COLOR_THEME_LABELS,
	COLOR_THEMES,
	type ColorTheme,
	type ThemeMode,
} from "#/lib/theme";

const MODE_ICONS: Record<ThemeMode, JSX.Element> = {
	light: <Sun className="size-4" />,
	dark: <Moon className="size-4" />,
	system: <Monitor className="size-4" />,
};

const MODE_LABELS: Record<ThemeMode, string> = {
	light: "Light",
	dark: "Dark",
	system: "System",
};

const COLOR_THEME_SWATCH: Record<ColorTheme, string> = {
	ocean: "bg-[oklch(0.68_0.18_200)]",
	emerald: "bg-[oklch(0.65_0.19_155)]",
	violet: "bg-[oklch(0.62_0.22_300)]",
};

function ModeSwitcher(): JSX.Element {
	const { mode, setMode } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					type="button"
					aria-label="Toggle color mode"
				>
					{MODE_ICONS[mode]}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{(["light", "dark", "system"] as const).map((option) => (
					<DropdownMenuItem
						key={option}
						onClick={() => setMode(option)}
						aria-pressed={mode === option}
					>
						{MODE_ICONS[option]}
						<span>{MODE_LABELS[option]}</span>
						{mode === option ? (
							<Check className="ml-auto size-4" />
						) : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function ColorThemeSwitcher(): JSX.Element {
	const { colorTheme, setColorTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					type="button"
					aria-label="Change color theme"
				>
					<Palette className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{COLOR_THEMES.map((option) => (
					<DropdownMenuItem
						key={option}
						onClick={() => setColorTheme(option)}
						aria-pressed={colorTheme === option}
					>
						<span
							className={`size-3 rounded-full ${COLOR_THEME_SWATCH[option]}`}
						/>
						<span>{COLOR_THEME_LABELS[option]}</span>
						{colorTheme === option ? (
							<Check className="ml-auto size-4" />
						) : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function ThemeSwitcher(): JSX.Element {
	return (
		<div className="flex items-center gap-2">
			<ColorThemeSwitcher />
			<ModeSwitcher />
		</div>
	);
}
