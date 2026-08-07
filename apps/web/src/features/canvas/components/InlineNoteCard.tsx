import { RefreshCw, X } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { Textarea } from "#/components/ui/textarea.tsx";
import {
	NOTE_TYPE_OPTIONS,
	type NoteType,
} from "#/features/notes/noteTypes.ts";

type InlineNoteCardProps = {
	pending: boolean;
	onSave: (payload: { type: NoteType; content: string }) => void;
	onCancel: () => void;
};

/**
 * Lightweight inline note-creation card rendered directly as a canvas node
 * at the double-clicked position. Saving turns it into a real note (and a
 * regular `NoteNode`); cancelling removes it without creating anything.
 */
export function InlineNoteCard({
	pending,
	onSave,
	onCancel,
}: InlineNoteCardProps) {
	const [type, setType] = React.useState<NoteType>("markdown");
	const [content, setContent] = React.useState("");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	React.useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSave = () => {
		if (!content.trim()) {
			onCancel();
			return;
		}
		onSave({ type, content: content.trim() });
	};

	return (
		<div className="w-64 rounded-lg border border-palm shadow-[0_0_16px_rgba(0,242,255,0.2)] bg-surface-strong/95 backdrop-blur-sm p-3 nodrag nowheel cursor-default">
			<div className="flex items-center justify-between gap-2 mb-2">
				<Select
					value={type}
					onValueChange={(value) => setType(value as NoteType)}
					disabled={pending}
				>
					<SelectTrigger className="h-7 text-[10px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{NOTE_TYPE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={onCancel}
					disabled={pending}
				>
					<X className="h-3 w-3" />
				</Button>
			</div>

			<Textarea
				ref={textareaRef}
				placeholder="Write your note..."
				className="min-h-20 text-xs bg-surface/60"
				value={content}
				disabled={pending}
				onChange={(e) => setContent(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
						e.preventDefault();
						handleSave();
					}
					if (e.key === "Escape") {
						onCancel();
					}
				}}
			/>

			<div className="mt-2 flex justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					size="xs"
					onClick={onCancel}
					disabled={pending}
				>
					Cancel
				</Button>
				<Button
					type="button"
					variant="default"
					size="xs"
					onClick={handleSave}
					disabled={pending}
				>
					{pending ? (
						<RefreshCw className="h-3 w-3 animate-spin" />
					) : (
						"Add note"
					)}
				</Button>
			</div>
		</div>
	);
}

export default InlineNoteCard;
