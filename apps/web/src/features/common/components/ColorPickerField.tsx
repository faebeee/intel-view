import { Button } from "#/components/ui/button.tsx";
import { HUD_INPUT_CLASS } from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { cn } from "#/lib/utils.ts";

export const COLOR_PRESETS = [
	{ name: "Tactical Red", value: "#ef4444" },
	{ name: "Laser Green", value: "#22c55e" },
	{ name: "Beacon Amber", value: "#eab308" },
	{ name: "Deep Sea", value: "#3b82f6" },
	{ name: "HUD Cyan", value: "#00f2ff" },
	{ name: "Sector Purple", value: "#a855f7" },
	{ name: "Stealth Slate", value: "#64748b" },
];

type ColorPickerFieldProps = {
	id: string;
	/** The current color value, or `null`/empty when unset (e.g. a note with no custom color, falling back to some other derived color). */
	value: string | null | undefined;
	onChange: (color: string) => void;
	/** When provided, renders a "Clear" button that calls it — for optional colors that can fall back to some other derived value (e.g. a note's first tag color). Omit for required colors (e.g. a tag's own color). */
	onClear?: () => void;
	clearLabel?: string;
	placeholder?: string;
	/** Color to show in the preview swatch when `value` is unset — e.g. a derived fallback color, so the picker still shows *something* meaningful. */
	previewFallbackColor?: string;
	disabled?: boolean;
	required?: boolean;
	className?: string;
};

/**
 * Hex-input + live swatch preview + preset-color-swatches picker, shared by
 * every place a color can be assigned (tag colors, note colors, ...).
 */
export function ColorPickerField({
	id,
	value,
	onChange,
	onClear,
	clearLabel = "Clear",
	placeholder = "#00f2ff",
	previewFallbackColor,
	disabled = false,
	required = false,
	className,
}: ColorPickerFieldProps) {
	const previewColor = value || previewFallbackColor;

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<div className="flex items-center gap-2">
				<Input
					id={id}
					type="text"
					placeholder={placeholder}
					className={`${HUD_INPUT_CLASS} font-mono flex-1`}
					value={value ?? ""}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					required={required}
				/>
				<div
					className={cn(
						"size-9 rounded border shrink-0 transition-all duration-200",
						previewColor ? "border-line/45" : "border-dashed border-line/60",
					)}
					style={previewColor ? { backgroundColor: previewColor } : undefined}
					title="Current Color Preview"
				/>
				{onClear && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onClear}
						disabled={disabled || !value}
					>
						{clearLabel}
					</Button>
				)}
			</div>

			<div className="flex flex-wrap gap-1.5 pt-1">
				{COLOR_PRESETS.map((preset) => (
					<button
						key={preset.value}
						type="button"
						onClick={() => onChange(preset.value)}
						disabled={disabled}
						className="size-5 rounded-full border border-black/40 hover:scale-110 active:scale-95 transition-all outline-none focus-visible:ring-1 focus-visible:ring-palm relative shrink-0 disabled:opacity-50 disabled:pointer-events-none"
						style={{ backgroundColor: preset.value }}
						title={preset.name}
					>
						{value === preset.value && (
							<span className="absolute inset-0 m-auto size-1.5 rounded-full bg-black/60" />
						)}
					</button>
				))}
			</div>
		</div>
	);
}

export default ColorPickerField;
