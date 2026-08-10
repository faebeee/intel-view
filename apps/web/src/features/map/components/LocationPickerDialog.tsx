import { MapPin } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LeafletMap } from "#/features/map/components/LeafletMap.tsx";
import { LocationSearchBar } from "#/features/map/components/LocationSearchBar.tsx";
import { cn } from "#/lib/utils.ts";

export type LocationPickerDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (lat: number, lng: number, label: string | null) => void;
	/** Dialog title. Defaults to a generic "Pick a location" label. */
	title?: string;
};

/**
 * Fullscreen dialog for picking a single map location, combining an
 * OpenStreetMap (Leaflet) click-to-place map with a Nominatim-backed
 * address search bar and an optional label. Reusable anywhere the app needs
 * the user to pick a `{ lat, lng, label }` point (e.g. inserting a
 * `[[geo:...]]` pin in the note editor, or any future "attach a location"
 * flow) — the caller only needs to handle `onConfirm`.
 */
export function LocationPickerDialog({
	open,
	onOpenChange,
	onConfirm,
	title = "Pick a location",
}: LocationPickerDialogProps) {
	const [pin, setPin] = React.useState<{ lat: number; lng: number } | null>(
		null,
	);
	const [label, setLabel] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setPin(null);
			setLabel("");
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-screen w-screen max-w-none flex-col gap-0 rounded-none p-0 sm:max-w-none">
				<DialogHeader className="border-b border-line/30 px-4 py-3">
					<DialogTitle className="flex items-center gap-2">
						<MapPin className="h-4 w-4 text-palm" />
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
					<LocationSearchBar
						onSelect={(result) => {
							setPin({ lat: result.lat, lng: result.lng });
							setLabel(result.label);
						}}
					/>

					<div className="relative flex-1 overflow-hidden rounded-md border border-line/45">
						<LeafletMap
							onClick={(lat, lng) => setPin({ lat, lng })}
							pin={pin}
							flyTo={pin}
						/>
					</div>

					<div className="flex items-center gap-3">
						<Input
							placeholder="Label (optional)"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							className="max-w-md"
						/>
						<p
							className={cn(
								"text-xs font-mono text-muted-foreground",
								!pin && "invisible",
							)}
						>
							{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "0, 0"}
						</p>
					</div>
				</div>

				<DialogFooter className="border-t border-line/30 px-4 py-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						disabled={!pin}
						onClick={() => {
							if (!pin) return;
							onConfirm(pin.lat, pin.lng, label.trim() || null);
						}}
					>
						Insert pin
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
