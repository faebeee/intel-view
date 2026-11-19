import type {
	NoteResponseDto as Note,
	PluginResponseDto as Plugin,
} from "@repo/sdk";
import { ChevronRight, ClipboardCopy, FilePlus2, Loader2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { noteTypeLabel } from "#/features/canvas/note-kind.ts";
import { useCreateNotePlugin } from "#/features/notes/hooks/useCreateNotePlugin.ts";
import { useExecuteAndCreateNotePlugin } from "#/features/notes/hooks/useExecuteAndCreateNotePlugin.ts";
import { useNotePluginsQuery } from "#/features/notes/hooks/useNotePluginsQuery.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { usePreviewNotePlugin } from "#/features/notes/hooks/usePreviewNotePlugin.ts";
import { copyToClipboard } from "#/lib/clipboard.ts";
import { cn } from "#/lib/utils.ts";

export type NotePluginsSidebarProps = {
	id?: string;
	projectId: number;
	/** The note the plugins run against; `null` while nothing is selected. */
	note: Note | null;
	className?: string;
};

/**
 * Left-hand sidebar listing the plugins available for the selected note
 * (filtered server-side by note type). Renders nothing unless the selected
 * note has at least one plugin. Clicking a plugin opens a modal with its
 * (ephemeral) preview, which can be copied or turned into a child note.
 */
export function NotePluginsSidebar({
	id,
	projectId,
	note,
	className,
}: NotePluginsSidebarProps): JSX.Element | null {
	const { data: plugins = [] } = useNotePluginsQuery(projectId, note?.id);
	const [selectedPlugin, setSelectedPlugin] = React.useState<Plugin | null>(
		null,
	);

	if (!note || plugins.length === 0) return null;

	return (
		<aside
			id={id}
			aria-label="Plugins"
			className={cn("flex min-h-0 flex-col gap-2", className)}
		>
			<div className="flex items-center justify-between px-1">
				<span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-mc-text-muted">
					Plugins
					<span className="ml-1.5 text-muted-foreground">{plugins.length}</span>
				</span>
			</div>
			<p
				className="truncate px-1 font-mono text-[11px] text-mc-text-2"
				title={getNoteLabel(note)}
			>
				{noteTypeLabel(note.type)} · {getNoteLabel(note)}
			</p>
			<ul className="m-0 flex min-h-0 list-none flex-col gap-1 overflow-y-auto p-0">
				{plugins.map((plugin) => (
					<li key={plugin.id}>
						<button
							type="button"
							onClick={() => setSelectedPlugin(plugin)}
							className="flex w-full cursor-pointer items-center gap-2 border border-mc-border bg-transparent px-2.5 py-2 text-left text-xs text-mc-text transition-colors hover:border-mc-accent hover:text-mc-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
						>
							<span className="min-w-0 flex-1 truncate">{plugin.label}</span>
							<ChevronRight className="h-3.5 w-3.5 shrink-0" />
						</button>
					</li>
				))}
			</ul>

			<Dialog
				open={selectedPlugin !== null}
				onOpenChange={(open) => {
					if (!open) setSelectedPlugin(null);
				}}
			>
				<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink sm:max-w-xl shadow-2xl shadow-black/80">
					{selectedPlugin && (
						<PluginPreview
							// Remount per plugin/note so each opening runs a fresh preview.
							key={`${note.id}:${selectedPlugin.id}`}
							projectId={projectId}
							noteId={note.id}
							plugin={selectedPlugin}
							onDone={() => setSelectedPlugin(null)}
						/>
					)}
				</DialogContent>
			</Dialog>
		</aside>
	);
}

function PluginPreview({
	projectId,
	noteId,
	plugin,
	onDone,
}: {
	projectId: number;
	noteId: number;
	plugin: Plugin;
	onDone: () => void;
}): JSX.Element {
	const previewMutation = usePreviewNotePlugin(projectId);
	const createNotePlugin = useCreateNotePlugin(projectId);
	const executeAndCreate = useExecuteAndCreateNotePlugin(projectId);
	const [previewContent, setPreviewContent] = React.useState<string | null>(
		null,
	);

	const { mutate: preview } = previewMutation;
	React.useEffect(() => {
		preview(
			{ noteId, pluginId: plugin.id },
			{ onSuccess: (data) => setPreviewContent(data) },
		);
	}, [preview, noteId, plugin.id]);

	const isBusy =
		previewMutation.isPending ||
		createNotePlugin.isPending ||
		executeAndCreate.isPending;

	const handleCopy = async (): Promise<void> => {
		if (previewContent === null) return;
		if (await copyToClipboard(previewContent)) {
			toast.success("Preview copied to clipboard");
		}
	};

	const handleCreate = (): void => {
		createNotePlugin.mutate(
			{ noteId, pluginId: plugin.id },
			{
				onSuccess: () => {
					toast.success("Note created from plugin");
					onDone();
				},
			},
		);
	};

	const handleExecuteAndCreate = (): void => {
		executeAndCreate.mutate(
			{ noteId, pluginId: plugin.id },
			{
				onSuccess: () => {
					toast.success("Note created from plugin output");
					onDone();
				},
			},
		);
	};

	return (
		<>
			<DialogHeader className="space-y-1">
				<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
					{plugin.label}
				</DialogTitle>
				<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
					Plugin preview content.
				</DialogDescription>
			</DialogHeader>

			<div className="min-h-32 max-h-96 overflow-y-auto rounded-md border border-line/50 bg-surface-strong/60 p-3 mb-4">
				{previewMutation.isPending ? (
					<div className="flex items-center justify-center h-32">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : (
					<pre className="whitespace-pre-wrap break-words text-sm text-sea-ink font-mono">
						{previewContent || "No preview available."}
					</pre>
				)}
			</div>

			<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isBusy || previewContent === null}
					onClick={handleCopy}
				>
					<ClipboardCopy className="h-3.5 w-3.5" />
					Copy preview
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isBusy}
					onClick={handleCreate}
				>
					{createNotePlugin.isPending ? (
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
					) : (
						<FilePlus2 className="h-3.5 w-3.5" />
					)}
					{createNotePlugin.isPending ? "Creating..." : "Create Note"}
				</Button>
				{plugin.executable && (
					<Button
						type="button"
						variant="default"
						size="sm"
						disabled={isBusy}
						onClick={handleExecuteAndCreate}
					>
						{executeAndCreate.isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<FilePlus2 className="h-3.5 w-3.5" />
						)}
						{executeAndCreate.isPending
							? "Executing..."
							: "Execute & Create Note"}
					</Button>
				)}
			</div>
		</>
	);
}
