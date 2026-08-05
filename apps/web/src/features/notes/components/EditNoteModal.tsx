import { noteControllerUpdate } from "@repo/sdk";
import type { Note } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";

type EditNoteModalProps = {
	note: Note | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function EditNoteModal({
	note,
	open,
	onOpenChange,
	onSuccess,
}: EditNoteModalProps) {
	const [content, setContent] = React.useState("");
	const [lat, setLat] = React.useState("");
	const [lng, setLng] = React.useState("");
	const queryClient = useQueryClient();

	// Prefill form states when note changes or modal opens
	React.useEffect(() => {
		if (note && open) {
			setContent(note.content || "");
			setLat(
				note.lat !== null && note.lat !== undefined ? String(note.lat) : "",
			);
			setLng(
				note.lng !== null && note.lng !== undefined ? String(note.lng) : "",
			);
		}
	}, [note, open]);

	const updateNoteMutation = useMutation({
		mutationFn: async (payload: {
			content: string;
			lat: number | null;
			lng: number | null;
		}) => {
			if (!note) throw new Error("No note selected");
			const res = await noteControllerUpdate({
				path: { id: note.id },
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note updated successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "all"] });
			queryClient.invalidateQueries({ queryKey: ["notes", "map"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to update note:", err);
			toast.error("Failed to update note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!content.trim()) {
			toast.warning("Empty content", {
				description: "Note content cannot be empty.",
			});
			return;
		}

		let parsedLat: number | null = null;
		let parsedLng: number | null = null;

		if (lat.trim() !== "" || lng.trim() !== "") {
			parsedLat = parseFloat(lat);
			parsedLng = parseFloat(lng);

			if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
				toast.warning("Invalid coordinates", {
					description:
						"Ensure latitude and longitude values are valid decimals or leave both blank.",
				});
				return;
			}
		}

		updateNoteMutation.mutate({
			content: content.trim(),
			lat: parsedLat,
			lng: parsedLng,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md md:max-w-3xl lg:max-w-4xl shadow-2xl shadow-black/80 duration-200 transition-all">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Edit Sector Note #{note?.id}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Modify note details or relocate coordinates for this entry using the
						real-time Markdown editor.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-5 my-2">
					{/* Markdown Live Editor */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-note-content"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Content / Intelligence Data (Markdown Supported)
						</label>
						<MarkdownEditor
							value={content}
							onChange={setContent}
							placeholder="Write markdown note details here..."
							disabled={updateNoteMutation.isPending}
							minHeight="min-h-36"
						/>
					</div>

					{/* 2-column Lat/Lng prefilled inputs */}
					<div className="flex flex-col gap-1.5 max-w-md">
						<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
							Geospatial Coordinates (Optional)
						</span>
						<div className="grid grid-cols-2 gap-3 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
							<div className="flex flex-col gap-1">
								<label
									htmlFor="edit-note-lat"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Latitude
								</label>
								<Input
									id="edit-note-lat"
									type="text"
									placeholder="e.g. 48.1351"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
									value={lat}
									onChange={(e) => setLat(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1 border-l border-line/30 pl-3">
								<label
									htmlFor="edit-note-lng"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Longitude
								</label>
								<Input
									id="edit-note-lng"
									type="text"
									placeholder="e.g. 11.5820"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
									value={lng}
									onChange={(e) => setLng(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
						</div>
						<p className="text-[9px] text-muted-foreground italic pl-1">
							Leave both coordinate fields blank to save this as a
							non-geolocated note.
						</p>
					</div>

					<DialogFooter className="pt-2 border-t border-line/30">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="border-line text-sea-ink-soft hover:bg-line/20 hover:text-sea-ink text-xs font-mono font-bold"
							onClick={() => onOpenChange(false)}
							disabled={updateNoteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="bg-palm text-background border-none hover:bg-palm/90 shadow-[0_0_10px_rgba(56,189,248,0.4)] font-mono font-bold text-xs h-9 px-4"
							disabled={updateNoteMutation.isPending}
						>
							{updateNoteMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
