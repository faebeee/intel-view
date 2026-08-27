import { Check, Monitor, Moon, Sun } from "lucide-react";
import type { JSX } from "react";
import { useTheme } from "#/components/theme-provider";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import type { ThemeMode } from "#/lib/theme";

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

/**
 * Light/dark/system mode switcher. The accent color palette is no longer a
 * global, user-level preference here — it's chosen per-project (see
 * `ProjectModal`) and applied automatically while that project is open (see
 * `Layout`).
 */
export function ThemeSwitcher(): JSX.Element {
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
						{mode === option ? <Check className="ml-auto size-4" /> : null}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
