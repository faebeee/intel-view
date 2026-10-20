import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Network, Save } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { SaveStatusIndicator } from "#/features/notes/components/NoteEditorPane.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";

type NoteIpEditorPaneProps = {
	projectId: number;
	note: Note;
	title: string;
	onTitleChange: (title: string) => void;
	saveStatus: NoteSaveStatus;
	disabled?: boolean;
	className?: string;
};

const IPV4_SEGMENT = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(\\.${IPV4_SEGMENT}){3}$`);
// Reasonably permissive IPv6 matcher (covers full, compressed "::" and
// mixed/IPv4-embedded forms); server-side validation is the source of truth.
const IPV6_REGEX =
	/^((([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:)))$/;

/** Returns a user-facing error message if `value` isn't a well-formed IPv4 or IPv6 address, or `null` if it's valid (empty is allowed — an ip note's content can be unset). */
function validateIp(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	if (IPV4_REGEX.test(trimmed) || IPV6_REGEX.test(trimmed)) {
		return null;
	}
	return "That doesn't look like a valid IPv4 or IPv6 address";
}

/**
 * Center-column pane for `'ip'`-type notes: the title input (same
 * autosave-driven control shared with the other panes) plus an editable IP
 * address text field with an explicit Save button — unlike standard note
 * content, saving is validated client-side (and re-validated server-side)
 * as a well-formed IPv4 or IPv6 address before being persisted, so it isn't
 * autosaved on every keystroke. Below the input, the saved address is shown
 * in a preview card.
 */
export function NoteIpEditorPane({
	projectId,
	note,
	title,
	onTitleChange,
	saveStatus,
	disabled = false,
	className,
}: NoteIpEditorPaneProps) {
	const queryClient = useQueryClient();
	const [draftIp, setDraftIp] = React.useState(note.content ?? "");
	const [initializedNoteId, setInitializedNoteId] = React.useState(note.id);

	// Re-initialize the draft whenever the selected note changes, without
	// clobbering in-flight edits on background refetches of the same note.
	React.useEffect(() => {
		if (initializedNoteId === note.id) return;
		setDraftIp(note.content ?? "");
		setInitializedNoteId(note.id);
	}, [note.id, note.content, initializedNoteId]);

	const updateIpMutation = useMutation({
		mutationFn: async (content: string) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: note.id },
				body: { content },
			});
			return res.data as Note;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["notes", "all", projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["notes", "history", projectId, note.id],
			});
		},
		onError: toastApiError("save IP address"),
	});

	const trimmedDraft = draftIp.trim();
	const hasUnsavedChanges = trimmedDraft !== (note.content ?? "").trim();
	const validationError = validateIp(draftIp);

	const handleSave = () => {
		if (updateIpMutation.isPending || validationError) return;
		updateIpMutation.mutate(draftIp);
	};

	const savedIp = (note.content ?? "").trim();

	return (
		<div
			className={cn(
				"flex flex-col gap-4 h-full min-h-0 p-4 overflow-y-auto",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3 shrink-0">
				<Input
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Untitled IP address"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<div className="flex flex-col gap-2 shrink-0">
				<label
					htmlFor="note-ip-input"
					className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
				>
					IP Address
				</label>
				<div className="flex items-center gap-2">
					<Input
						id="note-ip-input"
						value={draftIp}
						onChange={(e) => setDraftIp(e.target.value)}
						placeholder="192.168.1.1"
						disabled={disabled || updateIpMutation.isPending}
					/>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={
							disabled ||
							!hasUnsavedChanges ||
							!!validationError ||
							updateIpMutation.isPending
						}
					>
						<Save className="h-3.5 w-3.5" />
						<span>{updateIpMutation.isPending ? "Saving..." : "Save"}</span>
					</Button>
				</div>
				{hasUnsavedChanges && validationError && (
					<div className="flex items-start gap-2 text-xs text-red-400">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
						<span>{validationError}</span>
					</div>
				)}
			</div>

			<div className="flex-1 min-h-0 border-t border-line/50 pt-3">
				{savedIp ? (
					<div className="flex items-center gap-2 rounded-lg border border-line/50 p-3 text-sm text-palm break-all">
						<Network className="h-4 w-4 shrink-0" />
						<span className="flex-1 font-mono">{savedIp}</span>
					</div>
				) : (
					<p className="text-xs text-muted-foreground">
						Enter an IP address above and save to set this note's value.
					</p>
				)}
			</div>
		</div>
	);
}
