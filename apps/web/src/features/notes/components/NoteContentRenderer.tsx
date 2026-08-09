import type { NoteResponseDto as Note } from "@repo/sdk";
import { Markdown } from "#/components/ui/markdown.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";

type NoteContentRendererProps = {
	note: Note;
};

/** Renders a note's markdown body content. */
export function NoteContentRenderer({ note }: NoteContentRendererProps) {
	const { openNoteReference } = useNoteReference();

	return (
		<Markdown content={note.content} onNoteReferenceClick={openNoteReference} />
	);
}
