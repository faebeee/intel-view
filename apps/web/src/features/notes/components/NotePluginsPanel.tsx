"use client";

import type { PluginResponseDto as Plugin } from "@repo/sdk";
import {
	ArrowLeft,
	ClipboardCopy,
	FilePlus2,
	Loader2,
	Puzzle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog.tsx";
import { useCreateNote } from "#/features/notes/hooks/useCreateNote.ts";
import { useNotePluginsQuery } from "#/features/notes/hooks/useNotePluginsQuery.ts";
import { copyToClipboard } from "#/lib/clipboard.ts";
import { cn } from "#/lib/utils.ts";
import { usePreviewNotePlugin } from "../hooks/usePreviewNotePlugin";

export type NotePluginsPanelProps = {
	projectId: number;
	noteId: number | undefined;
	className?: string;
};

/**
 * Lists the plugins available for a note (filtered server-side by note
 * type) inside a modal. Clicking a plugin button runs it immediately and
 * switches the modal to a result view where the (ephemeral, non-persisted)
 * output can be copied to the clipboard or used as the content of a new
 * child note.
 *
 * Reusable across any view that shows note details (note details panel,
 * note settings panel, etc.). Renders nothing while no plugins are
 * available for the note's type.
 */
export function NotePluginsPanel({
	projectId,
	noteId,
	className,
}: NotePluginsPanelProps) {
	const { data: plugins = [] } = useNotePluginsQuery(projectId, noteId);
	const previewPluginMutation = usePreviewNotePlugin(projectId);
	const createNoteMutation = useCreateNote(projectId);
	const [open, setOpen] = React.useState(false);
	const [selectedPlugin, setSelectedPlugin] = React.useState<Plugin | null>(
		null,
	);
	const [previewContent, setPreviewContent] = React.useState<string | null>(
		null,
	);
	const [isLoading, setIsLoading] = React.useState(false);

	const resetState = React.useCallback(() => {
		setSelectedPlugin(null);
		setPreviewContent(null);
	}, []);

	const handleOpenChange = React.useCallback(
		(next: boolean) => {
			setOpen(next);
			if (!next) resetState();
		},
		[resetState],
	);

	const handleSelectPlugin = React.useCallback(
		(plugin: Plugin) => {
			if (noteId === undefined) return;
			setSelectedPlugin(plugin);
			setPreviewContent(null);
			previewPluginMutation.mutate(
				{ noteId, pluginId: plugin.id },
				{
					onSuccess: (data) => setPreviewContent(data),
				},
			);
		},
		[previewPluginMutation, noteId],
	);

	const handleCopyPreview = React.useCallback(async () => {
		if (previewContent === null) return;
		const copied = await copyToClipboard(previewContent);
		if (copied) {
			toast.success("Preview copied to clipboard");
		}
	}, [previewContent]);

	const handleExecuteAndCreate = React.useCallback(
		async () => {
			if (noteId === undefined || selectedPlugin === null) return;

			setIsLoading(true);
			try {
				// 1. Execute plugin
				const result = await previewPluginMutation.mutateAsync({
					noteId,
					pluginId: selectedPlugin.id,
				});

				// 2. Create child note automatically
				await createNoteMutation.mutateAsync({
					parentId: noteId,
					type: "standard",
					title: selectedPlugin.label,
					content: result,
				});

				toast.success("Note created from plugin output");
				handleOpenChange(false);
			} catch (err) {
				// Error handled by mutations' onError
			} finally {
				setIsLoading(false);
			}
		},
		[previewPluginMutation, createNoteMutation, noteId, selectedPlugin, handleOpenChange],
	);

	if (plugins.length === 0) {
		return null;
	}

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
				Plugins
			</span>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogTrigger asChild>
					<Button variant="outline" size="sm" className="w-fit">
						<Puzzle className="h-3.5 w-3.5" />
						<span>{plugins.length} available</span>
					</Button>
				</DialogTrigger>
				<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink sm:max-w-xl shadow-2xl shadow-black/80">
					{selectedPlugin === null ? (
						<>
							<DialogHeader className="space-y-1">
								<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
									Plugins
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
									Choose a plugin to run against this note.
								</DialogDescription>
							</DialogHeader>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
								{plugins.map((plugin) => (
									<Button
										key={plugin.id}
										variant="outline"
										className="h-auto min-h-16 whitespace-normal text-center justify-center py-2 px-3"
										onClick={() => handleSelectPlugin(plugin)}
									>
										{plugin.label}
									</Button>
								))}
							</div>
						</>
					) : (
						<>
							<DialogHeader className="space-y-1">
								<Button
									variant="ghost"
									size="sm"
									className="w-fit -ml-2 mb-1"
									onClick={resetState}
								>
									<ArrowLeft className="h-3.5 w-3.5" />
									Back
								</Button>
								<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
									{selectedPlugin.label}
								</DialogTitle>
								<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
									Plugin preview content.
								</DialogDescription>
							</DialogHeader>

							<div className="min-h-32 max-h-96 overflow-y-auto rounded-md border border-line/50 bg-surface-strong/60 p-3 mb-4">
								{previewPluginMutation.isPending ? (
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
									disabled={previewPluginMutation.isPending || previewContent === null}
									onClick={handleCopyPreview}
								>
									<ClipboardCopy className="h-3.5 w-3.5" />
									Copy preview
								</Button>
								<Button
									type="button"
									variant="default"
									size="sm"
									disabled={previewPluginMutation.isPending || isLoading}
									onClick={handleExecuteAndCreate}
								>
									{isLoading ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin" />
									) : (
										<FilePlus2 className="h-3.5 w-3.5" />
									)}
									{isLoading
										? "Executing..."
										: "Execute & Create Note"}
								</Button>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
