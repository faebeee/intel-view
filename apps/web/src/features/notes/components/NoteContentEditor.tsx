import type { NoteResponseDto as Note } from "@repo/sdk";
import type { JSX } from "react";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteEditorPane } from "#/features/notes/components/NoteEditorPane.tsx";
import { NoteFileEditorPane } from "#/features/notes/components/NoteFileEditorPane.tsx";
import { NoteIpEditorPane } from "#/features/notes/components/NoteIpEditorPane.tsx";
import { NoteLogEditorPane } from "#/features/notes/components/NoteLogEditorPane.tsx";
import { NoteUrlEditorPane } from "#/features/notes/components/NoteUrlEditorPane.tsx";

export type NoteContentEditorProps = {
	projectId: number;
	note: Note;
	notes: Note[];
	title: string;
	content: string;
	onTitleChange: (title: string) => void;
	onContentChange: (content: string) => void;
	saveStatus: NoteSaveStatus;
	className?: string;
};

/**
 * Picks and renders the correct type-specific editor pane for `note.type`
 * (falling back to the freely-editable `NoteEditorPane` for `'standard'`
 * notes). Shared between the standalone notes page and the in-modal note
 * editor so the per-type pane selection logic only lives in one place.
 */
export function NoteContentEditor({
	projectId,
	note,
	notes,
	title,
	content,
	onTitleChange,
	onContentChange,
	saveStatus,
	className,
}: NoteContentEditorProps): JSX.Element {
	if (note.type === "log") {
		return (
			<NoteLogEditorPane
				projectId={projectId}
				note={note}
				title={title}
				onTitleChange={onTitleChange}
				saveStatus={saveStatus}
				notes={notes}
				className={className}
			/>
		);
	}

	if (note.type === "file") {
		return (
			<NoteFileEditorPane
				projectId={projectId}
				note={note}
				title={title}
				onTitleChange={onTitleChange}
				saveStatus={saveStatus}
				className={className}
			/>
		);
	}

	if (note.type === "url") {
		return (
			<NoteUrlEditorPane
				projectId={projectId}
				note={note}
				title={title}
				onTitleChange={onTitleChange}
				saveStatus={saveStatus}
				className={className}
			/>
		);
	}

	if (note.type === "ip") {
		return (
			<NoteIpEditorPane
				projectId={projectId}
				note={note}
				title={title}
				onTitleChange={onTitleChange}
				saveStatus={saveStatus}
				className={className}
			/>
		);
	}

	return (
		<NoteEditorPane
			title={title}
			content={content}
			onTitleChange={onTitleChange}
			onContentChange={onContentChange}
			notes={notes}
			saveStatus={saveStatus}
			className={className}
		/>
	);
}
