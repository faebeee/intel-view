import type { NoteResponseDto as Note } from "@repo/sdk";
import { AppWindow } from "lucide-react";
import { Markdown } from "#/components/ui/markdown.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import type { IframeNoteConfig } from "#/features/notes/noteTypes.ts";
import { AddHistoryEntryForm } from "./AddHistoryEntryForm";
import { NoteHistoryEntries } from "./NoteHistoryEntries";

type NoteContentRendererProps = {
	note: Note;
};

/**
 * Renders a note's body based on its `type`. Each note type renders
 * completely differently in the UI - add new branches here as new types
 * are implemented (e.g. a live IP address location using `note.config.ip`).
 */
export function NoteContentRenderer({ note }: NoteContentRendererProps) {
	const { openNoteReference } = useNoteReference();

	switch (note.type) {
		case "markdown":
			return (
				<Markdown
					content={note.content}
					onNoteReferenceClick={openNoteReference}
				/>
			);
		case "iframe": {
			const config = (note.config || {}) as IframeNoteConfig;
			if (!config.url) {
				return (
					<div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
						<AppWindow className="h-6 w-6 opacity-40" />
						<p className="text-xs italic">
							No iframe URL has been configured for this note.
						</p>
					</div>
				);
			}
			return (
				<div className="flex flex-col gap-2">
					{note.content && (
						<Markdown
							content={note.content}
							onNoteReferenceClick={openNoteReference}
						/>
					)}
					<iframe
						src={config.url}
						title={`Note #${note.id} embedded content`}
						className="w-full h-[420px] rounded-lg border border-line bg-white"
						sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
					/>
				</div>
			);
		}
		case "log": {
			// 'log' notes have no content of their own; their detail view
			// directly displays the note's automatic change history as its
			// primary content, rather than tucking it away in a collapsible
			// "History" section like other note types (see NoteHistorySection).
			// Users can also add freeform manual entries directly here.
			return <LogNoteHistory projectId={note.projectId} noteId={note.id} />;
		}
		default:
			return (
				<Markdown
					content={note.content}
					onNoteReferenceClick={openNoteReference}
				/>
			);
	}
}

function LogNoteHistory({
	projectId,
	noteId,
}: {
	projectId: number;
	noteId: number;
}) {
	const { data: entries = [], isLoading } = useNoteHistoryQuery(
		projectId,
		noteId,
	);
	return (
		<div className="flex flex-col gap-4">
			<AddHistoryEntryForm projectId={projectId} noteId={noteId} />
			<NoteHistoryEntries
				entries={entries}
				isLoading={isLoading}
				emptyMessage="No history recorded yet."
			/>
		</div>
	);
}
