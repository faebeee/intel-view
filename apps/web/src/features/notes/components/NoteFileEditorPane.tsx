import type { NoteResponseDto as Note } from "@repo/sdk";
import {
	client,
	noteControllerRemoveFile,
	noteControllerUploadFile,
} from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Paperclip, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { SaveStatusIndicator } from "#/features/notes/components/NoteEditorPane.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";

type NoteFileEditorPaneProps = {
	projectId: number;
	note: Note;
	title: string;
	onTitleChange: (title: string) => void;
	saveStatus: NoteSaveStatus;
	disabled?: boolean;
	className?: string;
};

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatFileSize(size: number | null | undefined): string {
	if (size === null || size === undefined) return "unknown size";
	let value = size;
	let unit = 0;
	while (value >= 1024 && unit < SIZE_UNITS.length - 1) {
		value /= 1024;
		unit += 1;
	}
	const rounded = unit === 0 ? value : Math.round(value * 10) / 10;
	return `${rounded} ${SIZE_UNITS[unit]}`;
}

/**
 * Center-column pane for `'file'`-type notes: the title input (same
 * autosave-driven control shared with the other panes) plus a single
 * attachment slot. Bytes never travel to the object store directly from the
 * browser — uploads and downloads are proxied by the API
 * (`/projects/:projectId/notes/:id/file`), which is also why the download
 * link is built from the SDK client's configured base URL rather than a
 * presigned storage URL. Uploading while a file is already attached replaces
 * it (the previous object is deleted server-side).
 */
export function NoteFileEditorPane({
	projectId,
	note,
	title,
	onTitleChange,
	saveStatus,
	disabled = false,
	className,
}: NoteFileEditorPaneProps) {
	const queryClient = useQueryClient();
	const inputRef = React.useRef<HTMLInputElement>(null);

	const invalidateNote = React.useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
		queryClient.invalidateQueries({
			queryKey: ["notes", "history", projectId, note.id],
		});
	}, [queryClient, projectId, note.id]);

	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			const res = await noteControllerUploadFile({
				path: { projectId, id: note.id },
				body: { file },
			});
			return res.data;
		},
		onSuccess: invalidateNote,
		onError: toastApiError("upload file"),
	});

	const removeMutation = useMutation({
		mutationFn: async () => {
			const res = await noteControllerRemoveFile({
				path: { projectId, id: note.id },
			});
			return res.data;
		},
		onSuccess: invalidateNote,
		onError: toastApiError("remove file"),
	});

	const isBusy = uploadMutation.isPending || removeMutation.isPending;

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		// Reset the input so picking the same file again still fires a change.
		e.target.value = "";
		if (file) uploadMutation.mutate(file);
	};

	// `updatedAt` busts the browser cache when the attachment is replaced.
	const fileUrl = `${client.getConfig().baseUrl ?? ""}/projects/${projectId}/notes/${note.id}/file?v=${encodeURIComponent(note.updatedAt)}`;
	const isImage = note.fileMimeType?.startsWith("image/") ?? false;

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
					placeholder="Untitled file"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<input
				ref={inputRef}
				type="file"
				className="hidden"
				onChange={handleFileSelected}
			/>

			{note.fileName ? (
				<div className="flex flex-col gap-3 shrink-0">
					<div className="flex items-center gap-3 rounded-lg border border-line/50 bg-surface-strong/40 p-3">
						<Paperclip className="h-4 w-4 shrink-0 text-palm" />
						<div className="flex min-w-0 flex-col">
							<span className="truncate text-sm font-bold text-sea-ink">
								{note.fileName}
							</span>
							<span className="text-xs text-muted-foreground">
								{note.fileMimeType ?? "unknown type"} ·{" "}
								{formatFileSize(note.fileSize)}
							</span>
						</div>
						<div className="ml-auto flex items-center gap-2">
							<Button asChild size="sm" variant="outline">
								<a href={fileUrl} download={note.fileName}>
									<Download className="h-3.5 w-3.5" />
									<span>Download</span>
								</a>
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => inputRef.current?.click()}
								disabled={disabled || isBusy}
							>
								<Upload className="h-3.5 w-3.5" />
								<span>
									{uploadMutation.isPending ? "Uploading..." : "Replace"}
								</span>
							</Button>
							<Button
								size="sm"
								variant="ghost"
								onClick={() => removeMutation.mutate()}
								disabled={disabled || isBusy}
								title="Remove file"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>

					{isImage && (
						<img
							src={fileUrl}
							alt={note.fileName}
							className="max-h-[28rem] w-fit max-w-full rounded-lg border border-line/50 object-contain"
						/>
					)}
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={disabled || isBusy}
					className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line/70 p-8 text-center transition-colors hover:bg-surface-strong/60 disabled:opacity-60 shrink-0"
				>
					<Upload className="h-5 w-5 text-palm" />
					<span className="text-sm font-bold text-sea-ink">
						{uploadMutation.isPending ? "Uploading..." : "Upload a file"}
					</span>
					<span className="text-xs text-muted-foreground">
						One file per note — uploading again replaces it.
					</span>
				</button>
			)}
		</div>
	);
}
