import type { JSX } from "react";
import {
	COLOR_THEME_LABELS,
	COLOR_THEME_SWATCH,
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	isColorTheme,
} from "#/lib/theme.ts";

type ProjectColorBadgeProps = {
	color: string;
	className?: string;
};

/**
 * Small pill showing a project's chosen accent color palette (dot + label),
 * mirroring how the project folder color is displayed.
 */
export function ProjectColorBadge({
	color,
	className,
}: ProjectColorBadgeProps): JSX.Element {
	const theme: ColorTheme = isColorTheme(color) ? color : DEFAULT_COLOR_THEME;

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border border-line/50 bg-surface/60 px-2 py-0.5 text-[10px] font-mono text-sea-ink ${className ?? ""}`}
		>
			<span
				className={`size-2 rounded-full shrink-0 ${COLOR_THEME_SWATCH[theme]}`}
			/>
			{COLOR_THEME_LABELS[theme]}
		</span>
	);
}
