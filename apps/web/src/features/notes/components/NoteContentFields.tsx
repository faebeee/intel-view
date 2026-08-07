import {
	FormField,
	TERMINAL_INPUT_CLASS,
} from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import type { NoteType } from "#/features/notes/noteTypes.ts";

const NOTE_LABEL_MAX_LENGTH = 60;

type NoteContentFieldsProps = {
	projectId: number;
	type: NoteType;
	content: string;
	onContentChange: (value: string) => void;
	iframeUrl: string;
	onIframeUrlChange: (value: string) => void;
	disabled?: boolean;
	/** Distinguishes label/id wording between the create modal and edit route. */
	idPrefix?: string;
	markdownMinHeight?: string;
};

/**
 * Renders the note-type-conditional content fields (markdown editor, iframe
 * URL + caption, or a log-note info banner), shared by `CreateNoteModal`
 * and the note edit route so the two forms don't drift.
 */
export function NoteContentFields({
	projectId,
	type,
	content,
	onContentChange,
	iframeUrl,
	onIframeUrlChange,
	disabled,
	idPrefix = "note",
	markdownMinHeight = "min-h-36",
}: NoteContentFieldsProps) {
	const { openNoteReference } = useNoteReference();
	const { data: allNotes = [] } = useAllNotesQuery(projectId);

	if (type === "markdown") {
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

	if (type === "iframe") {
		return (
			<div className="flex flex-col gap-3">
				<FormField label="iFrame URL" htmlFor={`${idPrefix}-iframe-url`}>
					<Input
						id={`${idPrefix}-iframe-url`}
						type="url"
						placeholder="https://example.com"
						className={TERMINAL_INPUT_CLASS}
						value={iframeUrl}
						onChange={(e) => onIframeUrlChange(e.target.value)}
						disabled={disabled}
					/>
				</FormField>
				<FormField label="Caption (Optional)" htmlFor={`${idPrefix}-content`}>
					<Input
						id={`${idPrefix}-content`}
						type="text"
						placeholder="Short description shown alongside the embed"
						className={TERMINAL_INPUT_CLASS}
						value={content}
						onChange={(e) => onContentChange(e.target.value)}
						disabled={disabled}
					/>
				</FormField>
			</div>
		);
	}

	// type === "log"
	return (
		<div className="rounded-lg border border-line/50 bg-[#040814]/40 p-3 text-xs text-muted-foreground italic">
			Log notes have no content of their own. Their detail view directly
			displays this note's automatic change history, and lets you add your own
			freeform history entries.
		</div>
	);
}
