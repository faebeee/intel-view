import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import type { JSX } from "react";
import { cn } from "#/lib/utils.ts";

/**
 * Buttons from the mission-control handoff (§03). The primary variant has a
 * clipped bottom-right corner; clip-path hides outlines, so it's rendered
 * inside an unclipped `focus-wrap` span that draws the focus ring instead.
 */
const mcButtonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				primary:
					"cut-br bg-mc-accent px-[18px] font-display text-sm font-bold uppercase tracking-[0.06em] text-mc-on-accent hover:bg-mc-accent-hover",
				secondary:
					"border border-mc-border-strong bg-mc-panel px-4 font-medium text-mc-text hover:border-mc-edge-idle hover:bg-mc-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
				danger:
					"border border-mc-danger-border bg-transparent px-3.5 font-medium text-mc-danger-text hover:bg-mc-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
				/** Bordered square icon button (header refresh etc.). */
				icon: "border border-mc-border-strong bg-mc-panel text-mc-text hover:border-mc-edge-idle hover:bg-mc-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
				/** Borderless icon button (cards, table rows). */
				ghost:
					"bg-transparent text-mc-text-muted hover:text-mc-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mc-accent",
				/** Mono caps text link ("OPEN →"). */
				link: "bg-transparent px-1 font-mono text-xs tracking-[0.1em] uppercase text-mc-accent hover:text-mc-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
			},
			size: {
				default: "h-10",
				lg: "h-11",
				sm: "h-9",
				"icon-sm": "size-8",
				icon: "size-9",
				"icon-md": "size-10",
				"icon-lg": "size-11",
			},
		},
		defaultVariants: {
			variant: "secondary",
			size: "default",
		},
	},
);

type McButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof mcButtonVariants> & {
		asChild?: boolean;
		/** Classes for the focus wrapper of the primary variant (e.g. `flex-1`). */
		wrapperClassName?: string;
	};

export function McButton({
	className,
	wrapperClassName,
	variant = "secondary",
	size = "default",
	asChild = false,
	type = "button",
	...props
}: McButtonProps): JSX.Element {
	const Comp = asChild ? Slot.Root : "button";
	const button = (
		<Comp
			data-slot="mc-button"
			type={asChild ? undefined : type}
			className={cn(mcButtonVariants({ variant, size }), className)}
			{...props}
		/>
	);

	if (variant !== "primary") return button;

	return (
		<span className={cn("focus-wrap inline-flex", wrapperClassName)}>
			{button}
		</span>
	);
}

export { mcButtonVariants };
