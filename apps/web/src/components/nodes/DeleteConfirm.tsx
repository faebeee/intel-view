import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { JSX } from "react";

type DeleteConfirmProps = {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	isDeleting: boolean;
};

export function DeleteConfirm({
	isOpen,
	onConfirm,
	onCancel,
	isDeleting,
}: DeleteConfirmProps): JSX.Element | null {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
			<div className="island-shell w-full max-w-md p-6 rounded-lg border border-line bg-surface-strong shadow-xl animate-scale-up">
				<div className="flex items-start gap-4">
					<div className="p-3 bg-destructive/10 text-destructive rounded-full shrink-0">
						<AlertTriangle className="w-6 h-6" />
					</div>
					<div className="space-y-1.5 flex-1">
						<h3 className="text-lg font-bold text-sea-ink display-title">
							Delete Note
						</h3>
						<p className="text-sm text-sea-ink-soft leading-relaxed">
							Are you sure you want to delete this note? This action cannot be
							undone, and the note will be soft-deleted from the database.
						</p>
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6 pt-4 border-t border-line">
					<button
						type="button"
						onClick={onCancel}
						disabled={isDeleting}
						className="px-4 py-2 text-sm font-semibold text-sea-ink-soft hover:bg-sea-ink/5 rounded-md transition-all disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isDeleting}
						className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-destructive text-white rounded-md hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
					>
						{isDeleting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
						{isDeleting ? "Deleting..." : "Delete Note"}
					</button>
				</div>
			</div>
		</div>
	);
}
