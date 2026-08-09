import { FormField } from "#/components/ui/form-field.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";

const NOTE_LABEL_MAX_LENGTH = 60;

type NoteContentFieldsProps = {
	projectId: number;
	content: string;
	onContentChange: (value: string) => void;
	disabled?: boolean;
	/** Distinguishes label/id wording between the create modal and edit route. */
	idPrefix?: string;
	markdownMinHeight?: string;
};

/**
 * Renders the markdown content editor field, shared by `CreateNoteModal`
 * and the note edit route so the two forms don't drift.
 */
export function NoteContentFields({
	projectId,
	content,
	onContentChange,
	disabled,
	idPrefix = "note",
	markdownMinHeight = "min-h-36",
}: NoteContentFieldsProps) {
	const { openNoteReference } = useNoteReference();
	const { data: allNotes = [] } = useAllNotesQuery(projectId);

	const noteOptions = allNotes.map((n) => ({
		id: n.id,
		label: (n.content || "").slice(0, NOTE_LABEL_MAX_LENGTH) || "No content",
	}));

	return (
		<FormField
			label="Content (Markdown Supported)"
			htmlFor={`${idPrefix}-content`}
		>
			<MarkdownEditor
				value={content}
				onChange={onContentChange}
				placeholder="Write content here..."
				disabled={disabled}
				minHeight={markdownMinHeight}
				notes={noteOptions}
				onReferenceClick={openNoteReference}
			/>
		</FormField>
	);
}
