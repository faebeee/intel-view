import { Loader2, Puzzle } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { useExecuteNotePlugin } from "#/features/notes/hooks/useExecuteNotePlugin.ts";
import { useNotePluginsQuery } from "#/features/notes/hooks/useNotePluginsQuery.ts";
import { cn } from "#/lib/utils.ts";

export type NotePluginsPanelProps = {
	projectId: number;
	noteId: number | undefined;
	className?: string;
};

/**
 * Lists the plugins available for a note (filtered server-side by note
 * type) as a row of clickable buttons; clicking one executes it and renders
 * its (ephemeral, non-persisted) string result below. Reusable across any
 * view that shows note details (note details panel, note editor, etc.).
 *
 * Renders nothing while no plugins are available for the note's type.
 */
export function NotePluginsPanel({
	projectId,
	noteId,
	className,
}: NotePluginsPanelProps) {
	const { data: plugins = [] } = useNotePluginsQuery(projectId, noteId);
	const executePluginMutation = useExecuteNotePlugin(projectId);
	const [activePluginId, setActivePluginId] = React.useState<string | null>(
		null,
	);
	const [pluginResult, setPluginResult] = React.useState<string | null>(null);

	const handleRunPlugin = React.useCallback(
		(pluginId: string) => {
			if (noteId === undefined) return;
			setActivePluginId(pluginId);
			setPluginResult(null);
			executePluginMutation.mutate(
				{ noteId, pluginId },
				{
					onSuccess: (result) => setPluginResult(result),
					onSettled: () => setActivePluginId(null),
				},
			);
		},
		[executePluginMutation, noteId],
	);

	if (plugins.length === 0) {
		return null;
	}

	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
				Plugins
			</span>
			<div className="flex flex-wrap gap-1.5">
				{plugins.map((plugin) => (
					<Button
						key={plugin.id}
						variant="outline"
						size="sm"
						disabled={executePluginMutation.isPending}
						onClick={() => handleRunPlugin(plugin.id)}
					>
						{executePluginMutation.isPending && activePluginId === plugin.id ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Puzzle className="h-3.5 w-3.5" />
						)}
						<span>{plugin.label}</span>
					</Button>
				))}
			</div>
			{pluginResult !== null && (
				<pre className="mt-1 whitespace-pre-wrap break-all rounded-md border border-line/50 bg-sea-ink/5 p-2 text-[11px] font-mono text-sea-ink-soft">
					{pluginResult}
				</pre>
			)}
		</div>
	);
}
