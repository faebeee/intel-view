import type { Note } from "@repo/sdk";
import { Calendar, MapPin, Edit2 } from "lucide-react";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Markdown } from "#/components/ui/markdown.tsx";

type ViewNoteModalProps = {
	note: Note | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEditClick?: (note: Note) => void;
};

export function ViewNoteModal({
	note,
	open,
	onOpenChange,
	onEditClick,
}: ViewNoteModalProps) {
	if (!note) return null;

	const hasCoords =
		note.lat !== null &&
		note.lat !== undefined &&
		note.lng !== null &&
		note.lng !== undefined;

	const formattedDate = new Date(note.createdAt).toLocaleString([], {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-2xl shadow-2xl shadow-black/80 max-h-[85vh] flex flex-col p-0">
				{/* Modal Header */}
				<DialogHeader className="p-6 border-b border-line pb-4 shrink-0 space-y-1.5">
					<div className="flex items-center justify-between gap-4">
						<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
							Sector Intel Entry #{note.id}
						</DialogTitle>
						{onEditClick && (
							<Button
								variant="outline"
								size="xs"
								onClick={() => {
									onOpenChange(false);
									onEditClick(note);
								}}
								className="border-line hover:bg-accent/25 hover:text-palm text-sea-ink font-mono text-xs gap-1.5"
							>
								<Edit2 className="h-3 w-3" />
								<span>Edit Intel</span>
							</Button>
						)}
					</div>
					<DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1">
						<span className="flex items-center gap-1">
							<Calendar className="h-3.5 w-3.5 text-palm" />
							<span>RECORDED: {formattedDate}</span>
						</span>
						<span className="flex items-center gap-1">
							<MapPin className="h-3.5 w-3.5 text-palm" />
							{hasCoords ? (
								<span className="font-mono">
									LOC: [{note.lat?.toFixed(5)}, {note.lng?.toFixed(5)}]
								</span>
							) : (
								<span className="italic">Non-geolocated entry</span>
							)}
						</span>
					</DialogDescription>
				</DialogHeader>

				{/* Modal Body / Markdown Content */}
				<div className="flex-1 overflow-y-auto p-6 min-h-0 bg-[#040814]/30">
					<Markdown content={note.content} />
				</div>

				{/* Modal Footer */}
				<DialogFooter className="p-4 border-t border-line shrink-0 bg-surface-strong/40">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="border-line text-sea-ink-soft hover:bg-line/20 hover:text-sea-ink text-xs font-mono font-bold"
						onClick={() => onOpenChange(false)}
					>
						CLOSE TERMINAL
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
