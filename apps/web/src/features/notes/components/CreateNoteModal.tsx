import { FileText, MapPin, Paperclip, ScrollText } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group.tsx";
import { cn } from "#/lib/utils.ts";
import type { NoteType } from "#/types/note.ts";

export type CreateNoteModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the chosen note type when the user confirms creation. The caller owns which parent (if any) the note is created under. */
	onCreate: (type: NoteType) => void;
	isCreating?: boolean;
};

type NoteTypeOption = {
	value: NoteType;
	label: string;
	description: string;
	icon: typeof FileText;
};

const NOTE_TYPE_OPTIONS: NoteTypeOption[] = [
	{
		value: "standard",
		label: "Note",
		description: "A freely-editable rich text note.",
		icon: FileText,
	},
	{
		value: "log",
		label: "Log",
		description:
			"An append-only timestamped log — write entries over time instead of editing one document.",
		icon: ScrollText,
	},
	{
		value: "address",
		label: "Address",
		description:
			"A note tied to one location — its address is automatically resolved to map coordinates.",
		icon: MapPin,
	},
	{
		value: "file",
		label: "File",
		description:
			"A note holding a single uploaded file, stored in object storage and served through the API.",
		icon: Paperclip,
	},
];

/**
 * Small dialog shown before creating a note, letting the user pick its
 * type. A note's type is set once here and can't be changed afterwards
 * (see `Note.type` on the backend).
 */
export function CreateNoteModal({
	open,
	onOpenChange,
	onCreate,
	isCreating = false,
}: CreateNoteModalProps) {
	const [type, setType] = React.useState<NoteType>("standard");

	// Reset to the default choice every time the dialog is (re)opened.
	React.useEffect(() => {
		if (open) setType("standard");
	}, [open]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onCreate(type);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						New Note
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Choose what kind of note to create.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-2 my-2">
					<RadioGroup
						value={type}
						onValueChange={(value) => setType(value as NoteType)}
						className="gap-2"
					>
						{NOTE_TYPE_OPTIONS.map((option) => {
							const Icon = option.icon;
							const isSelected = type === option.value;
							return (
								<label
									key={option.value}
									htmlFor={`note-type-${option.value}`}
									className={cn(
										"flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
										isSelected
											? "border-palm bg-palm/10"
											: "border-line/50 hover:bg-surface-strong/60",
									)}
								>
									<RadioGroupItem
										id={`note-type-${option.value}`}
										value={option.value}
										className="mt-0.5"
									/>
									<Icon className="h-4 w-4 shrink-0 text-palm mt-0.5" />
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-bold text-sea-ink">
											{option.label}
										</span>
										<span className="text-xs text-muted-foreground leading-snug">
											{option.description}
										</span>
									</div>
								</label>
							);
						})}
					</RadioGroup>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={isCreating}
						>
							{isCreating ? "Creating..." : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
