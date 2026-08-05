import { Calendar, MapPin, Pencil, Trash2 } from "lucide-react";
import type { JSX } from "react";
import type { Note } from "../../types/note";

type NoteCardProps = {
	note: Note;
	onEdit: (note: Note) => void;
	onDelete: (id: number) => void;
	isDeleting?: boolean;
};

export function NoteCard({
	note,
	onEdit,
	onDelete,
	isDeleting = false,
}: NoteCardProps): JSX.Element {
	const formattedDate = new Date(note.createdAt).toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<div className="feature-card island-shell flex flex-col justify-between p-6 rounded-lg border border-line h-full transition duration-200">
			<div className="flex-1">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-1.5 text-xs font-semibold text-palm/80 bg-palm/10 px-2.5 py-1 rounded-full">
						<Calendar className="w-3.5 h-3.5" />
						<span>{formattedDate}</span>
					</div>
					<span className="text-xs text-sea-ink-soft">ID: {note.id}</span>
				</div>

				<p className="text-sea-ink text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap mb-4">
					{note.content}
				</p>
			</div>

			<div className="mt-4 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3 text-xs text-sea-ink-soft font-medium">
					{note.lat !== null || note.lng !== null ? (
						<div className="flex items-center gap-1 bg-sea-ink/5 px-2 py-1 rounded">
							<MapPin className="w-3.5 h-3.5 text-lagoon-deep" />
							<span>
								{note.lat !== null ? note.lat.toFixed(4) : "N/A"},{" "}
								{note.lng !== null ? note.lng.toFixed(4) : "N/A"}
							</span>
						</div>
					) : (
						<span className="italic text-sea-ink-soft/60">No location</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onEdit(note);
						}}
						className="p-1.5 rounded-md hover:bg-lagoon/15 text-sea-ink-soft hover:text-lagoon-deep transition-colors"
						title="Edit note"
						type="button"
					>
						<Pencil className="w-4 h-4" />
					</button>
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDelete(note.id);
						}}
						disabled={isDeleting}
						className="p-1.5 rounded-md hover:bg-destructive/15 text-sea-ink-soft hover:text-destructive transition-colors disabled:opacity-50"
						title="Delete note"
						type="button"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
