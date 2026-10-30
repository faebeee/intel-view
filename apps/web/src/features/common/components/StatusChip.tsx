import type { CSSProperties, JSX, ReactNode } from "react";
import { cn } from "#/lib/utils.ts";

type StatusChipProps = {
	/** Any CSS color, typically a token like `var(--mc-accent)`. */
	color: string;
	children: ReactNode;
	size?: "sm" | "md";
	className?: string;
};

/**
 * Status chip (handoff §03): square dot, border at ~32% and background at
 * 8% of the colour, mono caps label. Always carries a text label so status
 * never relies on colour alone.
 */
export function StatusChip({
	color,
	children,
	size = "sm",
	className,
}: StatusChipProps): JSX.Element {
	const style: CSSProperties = {
		borderColor: `color-mix(in srgb, ${color} 32%, transparent)`,
		backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
		color: `color-mix(in srgb, ${color} 65%, var(--mc-text))`,
	};

	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-2 border px-2.5 font-mono whitespace-nowrap",
				size === "sm"
					? "h-6 text-[10.5px] tracking-[0.1em] uppercase"
					: "h-[26px] text-[11.5px] tracking-[0.06em]",
				className,
			)}
			style={style}
		>
			<span
				aria-hidden="true"
				className="size-1.5 shrink-0"
				style={{ backgroundColor: color }}
			/>
			<span className="truncate">{children}</span>
		</span>
	);
}
