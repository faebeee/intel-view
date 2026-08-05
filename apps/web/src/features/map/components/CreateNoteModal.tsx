import { noteControllerCreate } from "@repo/sdk";
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
import { Textarea } from "#/components/ui/textarea";

type CreateNoteModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultLat?: number;
	defaultLng?: number;
	onSuccess?: () => void;
};

export function CreateNoteModal({
	open,
	onOpenChange,
	defaultLat,
	defaultLng,
	onSuccess,
}: CreateNoteModalProps) {
	const [content, setContent] = React.useState("");
	const [lat, setLat] = React.useState("");
	const [lng, setLng] = React.useState("");
	const queryClient = useQueryClient();

	// Update lat and lng state whenever default props change
	React.useEffect(() => {
		if (defaultLat !== undefined) setLat(String(defaultLat));
		if (defaultLng !== undefined) setLng(String(defaultLng));
	}, [defaultLat, defaultLng]);

	// Reset form when modal closes or opens
	React.useEffect(() => {
		if (!open) {
			setContent("");
		}
	}, [open]);

	const createNoteMutation = useMutation({
		mutationFn: async (payload: {
			content: string;
			lat: number;
			lng: number;
		}) => {
			const res = await noteControllerCreate({
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note added successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "map"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to create note:", err);
			toast.error("Failed to add note", {
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

		const parsedLat = parseFloat(lat);
		const parsedLng = parseFloat(lng);

		if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
			toast.warning("Invalid coordinates", {
				description: "Ensure latitude and longitude values are valid decimals.",
			});
			return;
		}

		createNoteMutation.mutate({
			content: content.trim(),
			lat: parsedLat,
			lng: parsedLng,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink">
						Add Note
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Create a new note at these coordinates.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					{/* Content Textarea */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="note-content"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft"
						>
							Content
						</label>
						<Textarea
							id="note-content"
							placeholder="Write note details here..."
							className="bg-[#040814]/60 border-line text-xs min-h-24 leading-relaxed"
							value={content}
							onChange={(e) => setContent(e.target.value)}
							disabled={createNoteMutation.isPending}
							required
						/>
					</div>

					{/* 2-column Lat/Lng prefilled inputs */}
					<div className="grid grid-cols-2 gap-3 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
						<div className="flex flex-col gap-1">
							<label
								htmlFor="note-lat"
								className="text-[9px] uppercase font-mono text-muted-foreground"
							>
								Latitude
							</label>
							<Input
								id="note-lat"
								type="text"
								className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0"
								value={lat}
								onChange={(e) => setLat(e.target.value)}
								disabled={createNoteMutation.isPending}
								required
							/>
						</div>
						<div className="flex flex-col gap-1 border-l border-line/30 pl-3">
							<label
								htmlFor="note-lng"
								className="text-[9px] uppercase font-mono text-muted-foreground"
							>
								Longitude
							</label>
							<Input
								id="note-lng"
								type="text"
								className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0"
								value={lng}
								onChange={(e) => setLng(e.target.value)}
								disabled={createNoteMutation.isPending}
								required
							/>
						</div>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="border-line text-sea-ink-soft hover:bg-line/20 hover:text-sea-ink text-xs"
							onClick={() => onOpenChange(false)}
							disabled={createNoteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							size="sm"
							className="bg-palm text-background border-none hover:bg-palm/90 shadow-[0_0_10px_rgba(56,189,248,0.4)] font-bold text-xs"
							disabled={createNoteMutation.isPending}
						>
							{createNoteMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Adding...
								</>
							) : (
								"Add Note"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
