"use client";

import type { PluginResponseDto as Plugin } from "@repo/sdk";
import { ClipboardCopy, FilePlus2, Loader2, Puzzle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover.tsx";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip.tsx";
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

type PluginAction = "copy" | "create";

/**
 * Lists the plugins available for a note (filtered server-side by note
 * type) inside a menu. Every entry exposes two actions:
 *
 * - **Run & copy**: executes the plugin and copies its (ephemeral,
 *   non-persisted) result to the clipboard.
 * - **Run & create note**: executes the plugin and creates a child note of
 *   the current note, titled after the plugin, with the plugin result as
 *   its initial content.
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
	const [pending, setPending] = React.useState<{
		pluginId: string;
		action: PluginAction;
	} | null>(null);

	const isPending = (pluginId: string, action: PluginAction): boolean =>
		pending?.pluginId === pluginId && pending.action === action;

	const handleRunAndCopy = React.useCallback(
		(pluginId: string) => {
			if (noteId === undefined) return;
			setPending({ pluginId, action: "copy" });
			previewPluginMutation.mutate(
				{ noteId, pluginId },
				{
					onSuccess: async (result) => {
						const copied = await copyToClipboard(result);
						if (copied) {
							toast.success("Copied to clipboard");
						}
					},
					onSettled: () => setPending(null),
				},
			);
		},
		[previewPluginMutation, noteId],
	);

	const handleRunAndCreateNote = React.useCallback(
		(plugin: Plugin) => {
			if (noteId === undefined) return;
			setPending({ pluginId: plugin.id, action: "create" });
			previewPluginMutation.mutate(
				{ noteId, pluginId: plugin.id },
				{
					onSuccess: async (result) => {
						try {
							await createNoteMutation.mutateAsync({
								parentId: noteId,
								type: "standard",
								title: plugin.label,
								content: result,
							});
							toast.success("Note created");
						} catch {
							// The mutation already surfaces a standardized error toast.
						}
					},
					onSettled: () => setPending(null),
				},
			);
		},
		[createNoteMutation, previewPluginMutation, noteId],
	);

	if (plugins.length === 0) {
		return null;
	}

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
				Plugins
			</span>
			<Popover>
				<PopoverTrigger asChild>
					<Button variant="outline" size="sm" className="w-fit">
						<Puzzle className="h-3.5 w-3.5" />
						<span>{plugins.length} available</span>
					</Button>
				</PopoverTrigger>
				<PopoverContent align="start" sideOffset={4} className="w-64 p-1">
					{plugins.map((plugin) => (
						<div
							key={plugin.id}
							className="flex items-center gap-1 rounded-sm px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
						>
							<span className="flex-1 truncate" title={plugin.label}>
								{plugin.label}
							</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-xs"
										aria-label={`Run ${plugin.label} and copy the result to the clipboard`}
										disabled={pending !== null}
										onClick={() => handleRunAndCopy(plugin.id)}
									>
										{isPending(plugin.id, "copy") ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : (
											<ClipboardCopy className="h-3 w-3" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>Run &amp; copy</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon-xs"
										aria-label={`Run ${plugin.label} and create a child note with the result`}
										disabled={pending !== null}
										onClick={() => handleRunAndCreateNote(plugin)}
									>
										{isPending(plugin.id, "create") ? (
											<Loader2 className="h-3 w-3 animate-spin" />
										) : (
											<FilePlus2 className="h-3 w-3" />
										)}
									</Button>
								</TooltipTrigger>
								<TooltipContent>Run &amp; create child note</TooltipContent>
							</Tooltip>
						</div>
					))}
				</PopoverContent>
			</Popover>
		</div>
	);
}
