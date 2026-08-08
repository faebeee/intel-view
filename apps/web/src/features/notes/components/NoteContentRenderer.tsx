import type { NoteResponseDto as Note } from "@repo/sdk";
import { AppWindow, AtSign, ExternalLink } from "lucide-react";
import { Markdown } from "#/components/ui/markdown.tsx";
import { useNoteReference } from "#/features/notes/context/NoteReferenceContext.tsx";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import type {
	IframeNoteConfig,
	SocialMediaNoteConfig,
} from "#/features/notes/noteTypes.ts";
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
		case "socialMedia": {
			const config = (note.config || {}) as SocialMediaNoteConfig;
			if (!config.username && !config.profileUrl) {
				return (
					<div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
						<AtSign className="h-6 w-6 opacity-40" />
						<p className="text-xs italic">
							No social media account details have been configured for this
							note.
						</p>
					</div>
				);
			}
			return (
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 rounded-lg border border-line/50 bg-[#040814]/40 p-3">
						<AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
						<div className="flex flex-col min-w-0">
							{config.platform && (
								<span className="text-[10px] uppercase tracking-wider text-muted-foreground">
									{config.platform}
								</span>
							)}
							<span className="text-sm font-medium truncate">
								{config.username || "Unknown username"}
							</span>
						</div>
						{config.profileUrl && (
							<a
								href={config.profileUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="ml-auto inline-flex items-center gap-1 text-xs text-[#00f2ff] hover:underline shrink-0"
							>
								View Profile
								<ExternalLink className="h-3 w-3" />
							</a>
						)}
					</div>
					{note.content && (
						<Markdown
							content={note.content}
							onNoteReferenceClick={openNoteReference}
						/>
					)}
				</div>
			);
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
