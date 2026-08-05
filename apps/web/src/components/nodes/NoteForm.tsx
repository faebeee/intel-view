import { Loader2, MapPin } from "lucide-react";
import type { FormEvent, JSX } from "react";
import { useEffect, useState } from "react";
import type { CreateNoteDto, Note } from "../../types/note";

type NoteFormProps = {
	initialValues?: Note | null;
	onSubmit: (data: CreateNoteDto) => void;
	onCancel: () => void;
	isSubmitting: boolean;
	submitLabel?: string;
};

export function NoteForm({
	initialValues = null,
	onSubmit,
	onCancel,
	isSubmitting,
	submitLabel,
}: NoteFormProps): JSX.Element {
	const [content, setContent] = useState("");
	const [lat, setLat] = useState<string>("");
	const [lng, setLng] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isGettingLocation, setIsGettingLocation] = useState(false);

	// Populate form if we are editing
	useEffect(() => {
		if (initialValues) {
			setContent(initialValues.content);
			setLat(initialValues.lat !== null ? String(initialValues.lat) : "");
			setLng(initialValues.lng !== null ? String(initialValues.lng) : "");
		} else {
			setContent("");
			setLat("");
			setLng("");
		}
		setError(null);
	}, [initialValues]);

	const handleGetLocation = () => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported by your browser");
			return;
		}

		setIsGettingLocation(true);
		setError(null);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLat(position.coords.latitude.toFixed(6));
				setLng(position.coords.longitude.toFixed(6));
				setIsGettingLocation(false);
			},
			(err) => {
				setError(`Failed to retrieve location: ${err.message}`);
				setIsGettingLocation(false);
			},
			{ enableHighAccuracy: true, timeout: 5000 },
		);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			setError("Note content is required");
			return;
		}

		const latitude = lat.trim() === "" ? null : Number(lat);
		const longitude = lng.trim() === "" ? null : Number(lng);

		if (
			latitude !== null &&
			(Number.isNaN(latitude) || latitude < -90 || latitude > 90)
		) {
			setError("Latitude must be a valid number between -90 and 90");
			return;
		}

		if (
			longitude !== null &&
			(Number.isNaN(longitude) || longitude < -180 || longitude > 180)
		) {
			setError("Longitude must be a valid number between -180 and 180");
			return;
		}

		onSubmit({
			content: content.trim(),
			lat: latitude,
			lng: longitude,
		});
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			{error && (
				<div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
					{error}
				</div>
			)}

			<div>
				<label
					className="block text-sm font-semibold text-sea-ink mb-1"
					htmlFor="note-content"
				>
					Content <span className="text-destructive">*</span>
				</label>
				<textarea
					id="note-content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Write your note content here..."
					rows={4}
					className="w-full px-3.5 py-2.5 text-sm bg-chip-bg border border-line rounded-md focus:outline-none focus:border-lagoon focus:ring-1 focus:ring-lagoon transition-all resize-y text-sea-ink"
					disabled={isSubmitting}
				/>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label
						className="block text-sm font-semibold text-sea-ink mb-1"
						htmlFor="note-lat"
					>
						Latitude
					</label>
					<input
						id="note-lat"
						type="text"
						value={lat}
						onChange={(e) => setLat(e.target.value)}
						placeholder="e.g. 52.5200"
						className="w-full px-3.5 py-2 text-sm bg-chip-bg border border-line rounded-md focus:outline-none focus:border-lagoon focus:ring-1 focus:ring-lagoon transition-all text-sea-ink"
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<label
						className="block text-sm font-semibold text-sea-ink mb-1"
						htmlFor="note-lng"
					>
						Longitude
					</label>
					<input
						id="note-lng"
						type="text"
						value={lng}
						onChange={(e) => setLng(e.target.value)}
						placeholder="e.g. 13.4050"
						className="w-full px-3.5 py-2 text-sm bg-chip-bg border border-line rounded-md focus:outline-none focus:border-lagoon focus:ring-1 focus:ring-lagoon transition-all text-sea-ink"
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div className="flex items-center justify-between pt-2">
				<button
					type="button"
					onClick={handleGetLocation}
					disabled={isGettingLocation || isSubmitting}
					className="flex items-center gap-1.5 text-xs font-semibold text-lagoon-deep hover:text-lagoon hover:bg-lagoon/5 px-2.5 py-1.5 rounded transition-all disabled:opacity-50"
				>
					{isGettingLocation ? (
						<Loader2 className="w-3.5 h-3.5 animate-spin" />
					) : (
						<MapPin className="w-3.5 h-3.5" />
					)}
					{isGettingLocation ? "Acquiring..." : "Use current location"}
				</button>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onCancel}
						disabled={isSubmitting}
						className="px-4 py-2 text-sm font-semibold text-sea-ink-soft hover:bg-sea-ink/5 rounded-md transition-all disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-palm hover:bg-palm/90 text-white rounded-md shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50"
					>
						{isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
						{submitLabel || (initialValues ? "Save Changes" : "Create Note")}
					</button>
				</div>
			</div>
		</form>
	);
}
