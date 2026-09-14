import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { toastApiError } from "#/lib/api-error.ts";

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Owns the "draft title/content with debounced autosave" behavior shared by
 * every place a note's title/content can be edited (the standalone notes
 * page, and the map/canvas quick-edit modal). Initializes local draft state
 * from `note` whenever a *different* note (or the same note id loading for
 * the first time) comes in, without clobbering in-flight local edits on
 * background refetches of the same note.
 */
export function useNoteDraftAutosave(projectId: number, note: Note | undefined) {
	const queryClient = useQueryClient();

	const invalidateNotes = React.useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		queryClient.invalidateQueries({
			queryKey: ["notes", "canvas", projectId],
		});
		queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
	}, [queryClient, projectId]);

	const invalidateNoteHistory = React.useCallback(
		(id: number) => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "history", projectId, id],
			});
		},
		[queryClient, projectId],
	);

	const updateNoteMutation = useMutation({
		mutationFn: async (args: {
			id: number;
			patch: Partial<Pick<Note, "title" | "content" | "tags" | "color">>;
		}) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: args.id },
				body: args.patch,
			});
			return res.data as Note;
		},
		onSuccess: (_data, variables) => {
			invalidateNotes();
			invalidateNoteHistory(variables.id);
		},
	});

	const [draftTitle, setDraftTitle] = React.useState("");
	const [draftContent, setDraftContent] = React.useState("");
	const [saveStatus, setSaveStatus] = React.useState<NoteSaveStatus>("idle");
	const savedRef = React.useRef<{ title: string; content: string }>({
		title: "",
		content: "",
	});
	// Tracks which note id the draft state was last initialized from. Used
	// to distinguish "note not loaded yet" (wait, don't clobber the draft
	// with an empty value) from "already-initialized note refetched in the
	// background" (also don't clobber - preserves in-flight local edits)
	// from "user selected a different note, or this note just finished
	// loading for the first time" (do (re)initialize).
	const [initializedNoteId, setInitializedNoteId] = React.useState<
		number | undefined
	>(undefined);

	React.useEffect(() => {
		if (note === undefined) {
			setInitializedNoteId(undefined);
			setDraftTitle("");
			setDraftContent("");
			savedRef.current = { title: "", content: "" };
			setSaveStatus("idle");
			return;
		}

		// Already initialized the draft for this exact note id - a background
		// refetch returning the same note shouldn't clobber in-flight edits.
		if (initializedNoteId === note.id) return;

		setDraftTitle(note.title ?? "");
		setDraftContent(note.content ?? "");
		savedRef.current = {
			title: note.title ?? "",
			content: note.content ?? "",
		};
		setSaveStatus("idle");
		setInitializedNoteId(note.id);
	}, [note, initializedNoteId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally depends on note.id (not the whole object) and omits the stable updateNoteMutation.mutate function
	React.useEffect(() => {
		if (!note) return;
		// Guards against autosaving before the draft has actually been
		// initialized from this note's real data (see the effect above) - a
		// belt-and-suspenders check against ever persisting a spuriously
		// empty draft over real content.
		if (initializedNoteId !== note.id) return;
		if (
			draftTitle === savedRef.current.title &&
			draftContent === savedRef.current.content
		) {
			return;
		}

		setSaveStatus("saving");
		const timeout = setTimeout(() => {
			updateNoteMutation.mutate(
				{
					id: note.id,
					patch: { title: draftTitle, content: draftContent },
				},
				{
					onSuccess: () => {
						savedRef.current = { title: draftTitle, content: draftContent };
						setSaveStatus("saved");
					},
					onError: (error) => {
						toastApiError("save note")(error);
						setSaveStatus("error");
					},
				},
			);
		}, AUTOSAVE_DEBOUNCE_MS);

		return () => clearTimeout(timeout);
	}, [draftTitle, draftContent, note?.id, initializedNoteId]);

	return {
		draftTitle,
		draftContent,
		setDraftTitle,
		setDraftContent,
		saveStatus,
		initializedNoteId,
		updateNoteMutation,
		invalidateNotes,
		invalidateNoteHistory,
	};
}
