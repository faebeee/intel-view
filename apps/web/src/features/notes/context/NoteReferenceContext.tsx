import * as React from "react";

type NoteReferenceContextValue = {
	projectId: number;
	/** ID of the note currently shown in the reference sidebar, or `null` if closed. */
	openNoteId: number | null;
	/** Opens the reference sidebar for the given note id (or switches it if already open). */
	openNoteReference: (noteId: number) => void;
	/** Closes the reference sidebar. */
	closeNoteReference: () => void;
};

const NoteReferenceContext =
	React.createContext<NoteReferenceContextValue | null>(null);

type NoteReferenceProviderProps = {
	projectId: number;
	children: React.ReactNode;
};

/**
 * Provides the ability for markdown content anywhere under it (note detail
 * views, the notes list, the markdown editor's preview pane, canvas/map
 * views, etc.) to open a note-reference sidebar for a `[[NOTE_ID]]` chip,
 * regardless of which component rendered that markdown. Mounted once per
 * project at the `/projects/$projectId` layout route, alongside
 * `NoteReferenceSheet`, which actually renders the sidebar.
 */
export function NoteReferenceProvider({
	projectId,
	children,
}: NoteReferenceProviderProps) {
	const [openNoteId, setOpenNoteId] = React.useState<number | null>(null);

	const value = React.useMemo<NoteReferenceContextValue>(
		() => ({
			projectId,
			openNoteId,
			openNoteReference: (noteId: number) => setOpenNoteId(noteId),
			closeNoteReference: () => setOpenNoteId(null),
		}),
		[projectId, openNoteId],
	);

	return (
		<NoteReferenceContext.Provider value={value}>
			{children}
		</NoteReferenceContext.Provider>
	);
}

/**
 * Access the note-reference sidebar controls. Must be used within a
 * `NoteReferenceProvider` (mounted at the `/projects/$projectId` layout).
 */
export function useNoteReference(): NoteReferenceContextValue {
	const context = React.useContext(NoteReferenceContext);
	if (!context) {
		throw new Error(
			"useNoteReference must be used within a NoteReferenceProvider",
		);
	}
	return context;
}
