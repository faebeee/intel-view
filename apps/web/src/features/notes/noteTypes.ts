import { FileText } from "lucide-react";
import type { NoteResponseDto } from "@repo/sdk";

export type NoteType = NoteResponseDto["type"];

export type NoteTypeOption = {
	value: NoteType;
	label: string;
	description: string;
	icon: typeof FileText;
};

/**
 * Registry of all note types supported by the UI.
 *
 * To add a new note type in the future (e.g. an embedded iframe, or a live
 * IP address location), add an entry here, implement a renderer branch in
 * `NoteContentRenderer.tsx`, and (if it needs type-specific settings) add
 * the relevant fields to `CreateNoteModal.tsx`/`EditNoteModal.tsx` that
 * read/write the note's `config` object.
 */
export const NOTE_TYPE_OPTIONS: NoteTypeOption[] = [
	{
		value: "markdown",
		label: "Markdown",
		description: "Rich text note with markdown formatting",
		icon: FileText,
	},
];

export function getNoteTypeOption(type: NoteType | undefined): NoteTypeOption {
	return (
		NOTE_TYPE_OPTIONS.find((option) => option.value === type) ??
		NOTE_TYPE_OPTIONS[0]
	);
}
