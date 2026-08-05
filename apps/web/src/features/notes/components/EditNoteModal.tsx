import { noteControllerUpdate } from "@repo/sdk";
import type { Note } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Check } from "lucide-react";
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
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

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
	const [selectedTagIds, setSelectedTagIds] = React.useState<number[]>([]);
	const queryClient = useQueryClient();

	const { data: availableTags = [] } = useAllTagsQuery();

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
			setSelectedTagIds((note.tags || []).map((t) => t.id));
		}
	}, [note, open]);

	const updateNoteMutation = useMutation({
		mutationFn: async (payload: {
			content: string;
			lat: number | null;
			lng: number | null;
			tagIds: number[];
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

	const handleTagToggle = (tagId: number) => {
		setSelectedTagIds((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId],
		);
	};

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
			tagIds: selectedTagIds,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md md:max-w-3xl lg:max-w-4xl shadow-2xl shadow-black/80 duration-200 transition-all">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Edit Note #{note?.id}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Edit note details, tags, and coordinates with markdown preview.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-5 my-2">
					{/* Markdown Live Editor */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-note-content"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Content (Markdown Supported)
						</label>
						<MarkdownEditor
							value={content}
							onChange={setContent}
							placeholder="Write markdown details here..."
							disabled={updateNoteMutation.isPending}
							minHeight="min-h-36"
						/>
					</div>

					{/* Tag Assosication Selector */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
							Tags
						</span>
						<div className="flex flex-wrap gap-2 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
							{availableTags.length > 0 ? (
								availableTags.map((tag) => {
									const isSelected = selectedTagIds.includes(tag.id);
									const displayColor = tag.color || "#00f2ff";
									return (
										<button
											key={tag.id}
											type="button"
											onClick={() => handleTagToggle(tag.id)}
											className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase border transition-all duration-200 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-palm"
											style={{
												backgroundColor: isSelected
													? `${displayColor}20`
													: "transparent",
												borderColor: isSelected
													? displayColor
													: "rgba(0, 242, 255, 0.16)",
												color: isSelected
													? displayColor
													: "rgba(240, 249, 255, 0.4)",
												boxShadow: isSelected
													? `0 0 10px ${displayColor}18`
													: "none",
											}}
										>
											{isSelected && <Check className="h-3 w-3" />}
											<span>{tag.name}</span>
										</button>
									);
								})
							) : (
								<p className="text-[10px] text-muted-foreground italic font-mono pl-1 py-1">
									No tags configured. Create tags in the Tags tab to organize
									notes.
								</p>
							)}
						</div>
					</div>

					{/* 2-column Lat/Lng prefilled inputs */}
					<div className="flex flex-col gap-1.5 max-w-md">
						<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
							Coordinates (Optional)
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
							Leave coordinates blank to save as a non-geolocated note.
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
