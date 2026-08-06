import type { NoteResponseDto } from "@repo/sdk";
import { AppWindow, FileText, History } from "lucide-react";

export type NoteType = NoteResponseDto["type"];

export type NoteTypeOption = {
	value: NoteType;
	label: string;
	description: string;
	icon: typeof FileText;
};

/** Shape of `config` for a note of type `'iframe'`. */
export type IframeNoteConfig = {
	url?: string;
};

/**
 * Registry of all note types supported by the UI.
 *
 * To add a new note type in the future (e.g. a live IP address location),
 * add an entry here, implement a renderer branch in
 * `NoteContentRenderer.tsx` and `MarkerLayer.tsx` (for map rendering), and
 * (if it needs type-specific settings) add the relevant fields to
 * `CreateNoteModal.tsx` and the notes `$id/edit.tsx` route that read/write
 * the note's `config` object.
 */
export const NOTE_TYPE_OPTIONS: NoteTypeOption[] = [
	{
		value: "markdown",
		label: "Markdown",
		description: "Rich text note with markdown formatting",
		icon: FileText,
	},
	{
		value: "iframe",
		label: "iFrame",
		description: "Embeds an external web page inside the note",
		icon: AppWindow,
	},
	{
		value: "log",
		label: "Log",
		description:
			"Has no content of its own; directly displays the note's automatic change history",
		icon: History,
	},
];

export function getNoteTypeOption(type: NoteType | undefined): NoteTypeOption {
	return (
		NOTE_TYPE_OPTIONS.find((option) => option.value === type) ??
		NOTE_TYPE_OPTIONS[0]
	);
}
