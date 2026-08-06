import type { NoteResponseDto as Note } from "@repo/sdk";
import { Markdown } from "#/components/ui/markdown.tsx";

type NoteContentRendererProps = {
	note: Note;
};

/**
 * Renders a note's body based on its `type`. Each note type renders
 * completely differently in the UI - add new branches here as new types
 * are implemented (e.g. an embedded iframe using `note.config.url`, or a
 * live IP address location using `note.config.ip`).
 */
export function NoteContentRenderer({ note }: NoteContentRendererProps) {
	switch (note.type) {
		case "markdown":
			return <Markdown content={note.content} />;
		default:
			return <Markdown content={note.content} />;
	}
}
