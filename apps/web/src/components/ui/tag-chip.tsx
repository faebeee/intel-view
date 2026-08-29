import { cn } from "#/lib/utils.ts";

type TagChipProps = {
	tag: string;
	color: string;
	size?: "xs" | "sm";
	className?: string;
};

/**
 * Small colored chip rendering a tag name using its resolved display color.
 * Colors come from the global tag registry (`useTagColorMap`) and are
 * applied dynamically via inline `style`, so this intentionally does not
 * build on the variant-based shadcn `Badge` (which only supports a fixed
 * set of static color variants).
 */
export function TagChip({ tag, color, size = "xs", className }: TagChipProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded font-mono font-bold uppercase border",
				size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
				className,
			)}
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
				borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
				color,
			}}
		>
			{tag}
		</span>
	);
}

type TagChipListProps = {
	tags: string[];
	tagColorMap: Map<string, string>;
	size?: "xs" | "sm";
	className?: string;
};

/** Renders a wrapping row of `TagChip`s, resolving each tag's color via `tagColorMap`. */
export function TagChipList({
	tags,
	tagColorMap,
	size = "xs",
	className,
}: TagChipListProps) {
	if (tags.length === 0) return null;

	return (
		<div className={cn("flex flex-wrap gap-1.5", className)}>
			{tags.map((tag) => (
				<TagChip
					key={tag}
					tag={tag}
					color={tagColorMap.get(tag.toLowerCase()) || "var(--primary)"}
					size={size}
				/>
			))}
		</div>
	);
}
