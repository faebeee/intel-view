import { FormField } from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input.tsx";

type CoordinateInputsProps = {
	lat: string;
	lng: string;
	onLatChange: (value: string) => void;
	onLngChange: (value: string) => void;
	disabled?: boolean;
	/** Shown under the grid; typically clarifies that blank coordinates are allowed. */
	hint?: string;
};

/**
 * Shared latitude/longitude 2-column input grid used by both the
 * create-note modal and the note edit route.
 */
export function CoordinateInputs({
	lat,
	lng,
	onLatChange,
	onLngChange,
	disabled,
	hint,
}: CoordinateInputsProps) {
	return (
		<FormField label="Coordinates (Optional)" hint={hint} className="max-w-md">
			<div className="grid grid-cols-2 gap-3 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
				<div className="flex flex-col gap-1">
					<label
						htmlFor="note-coord-lat"
						className="text-[9px] uppercase font-mono text-muted-foreground"
					>
						Latitude
					</label>
					<Input
						id="note-coord-lat"
						type="text"
						placeholder="e.g. 48.1351"
						className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
						value={lat}
						onChange={(e) => onLatChange(e.target.value)}
						disabled={disabled}
					/>
				</div>
				<div className="flex flex-col gap-1 border-l border-line/30 pl-3">
					<label
						htmlFor="note-coord-lng"
						className="text-[9px] uppercase font-mono text-muted-foreground"
					>
						Longitude
					</label>
					<Input
						id="note-coord-lng"
						type="text"
						placeholder="e.g. 11.5820"
						className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
						value={lng}
						onChange={(e) => onLngChange(e.target.value)}
						disabled={disabled}
					/>
				</div>
			</div>
		</FormField>
	);
}
