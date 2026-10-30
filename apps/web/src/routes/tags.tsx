import type { TagResponseDto as Tag } from "@repo/sdk";
import { tagControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	Pencil,
	RefreshCw,
	Tag as TagIcon,
	Trash2,
} from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { LoadingState, StatePanel } from "#/components/ui/loading-state.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import {
	PageHeader,
	PageShell,
	StatusBar,
} from "#/features/common/components/PageShell.tsx";
import { StatusChip } from "#/features/common/components/StatusChip.tsx";
import { TagCreateForm } from "#/features/tags/components/TagCreateForm.tsx";
import { TagModal } from "#/features/tags/components/TagModal.tsx";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { formatIsoDateTime } from "#/lib/format.ts";
import { readLastProjectId } from "#/lib/last-project.ts";
import { cn } from "#/lib/utils.ts";

export const Route = createFileRoute("/tags")({
	component: TagsRouteComponent,
});

const TH_CLASS =
	"border-b border-mc-border px-5 py-3 text-left font-mono text-[10.5px] font-medium tracking-[0.12em] text-mc-text-muted uppercase";
const TD_CLASS = "h-14 border-b border-mc-row-divider px-5";

function TagsRouteComponent(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: tags = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllTagsQuery();

	const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);
	const [query, setQuery] = React.useState("");
	const filterId = React.useId();

	// Read after mount so the server render and hydration agree.
	const [lastProjectId, setLastProjectId] = React.useState<string | null>(null);
	React.useEffect(() => setLastProjectId(readLastProjectId()), []);

	const handleEditClick = (tag: Tag) => {
		setEditingTag(tag);
		setIsEditOpen(true);
	};

	const removeTagMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await tagControllerRemove({
				path: { id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Tag deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["tags", "all"] });
		},
		onError: toastApiError("delete tag"),
	});

	const rows = React.useMemo(() => {
		const needle = query.trim().toLowerCase();
		return tags
			.filter((tag) => !needle || tag.name.toLowerCase().includes(needle))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [tags, query]);

	const isBusy = isLoading || isRefetching;
	const countLabel = `${tags.length} ${tags.length === 1 ? "tag" : "tags"}`;

	return (
		<PageShell
			header={<PageHeader kicker="Workspace" title="Tags" />}
			status={<StatusBar items={[countLabel]} />}
		>
			<div className="flex max-w-[1320px] flex-wrap items-start gap-6">
				<TagCreateForm />

				<section
					aria-label="All tags"
					className="flex min-w-0 flex-[999_1_480px] flex-col border border-mc-border bg-mc-panel"
				>
					<div className="flex flex-wrap items-center gap-3 border-b border-mc-border px-5 py-3.5">
						<h2 className="m-0 font-display text-lg font-semibold tracking-[0.04em] uppercase">
							All tags
						</h2>
						<span className="font-mono text-[11px] tracking-[0.1em] text-mc-text-2">
							{tags.length}
						</span>
						<span className="flex-1" />
						{tags.length > 0 && (
							<label
								htmlFor={filterId}
								className="mc-input-focus flex h-9 w-56 max-w-full items-center gap-2 border border-mc-border-strong bg-mc-bg px-3 font-mono text-xs text-mc-text-muted"
							>
								<span aria-hidden="true" className="text-mc-accent">
									›
								</span>
								<span className="sr-only">Filter tags</span>
								<input
									id={filterId}
									type="search"
									value={query}
									onChange={(event) => setQuery(event.target.value)}
									placeholder="filter tags"
									className="min-w-0 flex-1 border-0 bg-transparent text-mc-text outline-none placeholder:text-mc-text-muted"
								/>
							</label>
						)}
						<McButton
							variant="icon"
							size="icon"
							onClick={() => refetch()}
							disabled={isBusy}
							aria-label="Refresh tags"
							title="Refresh"
						>
							<RefreshCw className={isBusy ? "animate-spin" : ""} />
						</McButton>
					</div>

					{isLoading && !isRefetching ? (
						<LoadingState label="Loading tags..." compact />
					) : tags.length === 0 ? (
						<StatePanel
							icon={<TagIcon className="size-[22px]" strokeWidth={1.6} />}
							title="No tags yet"
							description="Create your first tag on the left, or add one straight from a note's editor on the canvas."
							action={
								<Link
									{...(lastProjectId
										? {
												to: "/projects/$projectId",
												params: { projectId: lastProjectId },
											}
										: { to: "/" })}
									className="flex h-11 items-center gap-2 border border-mc-border-strong px-4 font-mono text-[11.5px] tracking-[0.1em] text-mc-text no-underline uppercase hover:border-mc-edge-idle hover:bg-mc-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
								>
									{lastProjectId ? "Go to a canvas" : "Go to folders"}
									<ArrowRight className="size-3.5" />
								</Link>
							}
						/>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[560px] border-collapse">
								<thead>
									<tr>
										<th scope="col" className={cn(TH_CLASS, "w-16")}>
											ID
										</th>
										<th scope="col" className={TH_CLASS}>
											Tag
										</th>
										<th scope="col" className={TH_CLASS}>
											Color
										</th>
										<th scope="col" className={TH_CLASS}>
											Created
										</th>
										<th scope="col" className={TH_CLASS}>
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((tag) => (
										<tr
											key={tag.id}
											className="transition-colors hover:bg-mc-panel-hover"
										>
											<td
												className={cn(
													TD_CLASS,
													"font-mono text-[11px] text-mc-text-muted",
												)}
											>
												#{tag.id}
											</td>
											<td className={TD_CLASS}>
												<StatusChip
													color={tag.color || "var(--mc-text-muted)"}
													size="md"
												>
													{tag.name}
												</StatusChip>
											</td>
											<td
												className={cn(
													TD_CLASS,
													"font-mono text-xs text-mc-text-2 uppercase",
												)}
											>
												{tag.color || "—"}
											</td>
											<td
												className={cn(
													TD_CLASS,
													"font-mono text-xs whitespace-nowrap text-mc-text-2",
												)}
											>
												{formatIsoDateTime(tag.createdAt)}
											</td>
											<td className={cn(TD_CLASS, "pr-3")}>
												<div className="flex items-center justify-end gap-0.5">
													<McButton
														variant="ghost"
														size="icon"
														aria-label={`Edit tag ${tag.name}`}
														title="Edit tag"
														onClick={() => handleEditClick(tag)}
													>
														<Pencil
															className="size-[15px]"
															strokeWidth={1.75}
														/>
													</McButton>
													<ConfirmationButton
														onClick={() => removeTagMutation.mutate(tag.id)}
														title={`Delete tag "${tag.name}"?`}
														description="It will be removed from every project. This can't be undone."
														confirmText="Delete tag"
														trigger={
															<McButton
																variant="ghost"
																size="icon"
																aria-label={`Delete tag ${tag.name}`}
																title="Delete tag"
																disabled={removeTagMutation.isPending}
																className="hover:text-mc-danger-text"
															>
																<Trash2
																	className="size-[15px]"
																	strokeWidth={1.75}
																/>
															</McButton>
														}
													/>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
							{rows.length === 0 && (
								<p className="m-0 px-5 py-10 text-center font-mono text-xs tracking-[0.1em] text-mc-text-muted uppercase">
									No tags match the filter
								</p>
							)}
						</div>
					)}
				</section>
			</div>

			{/* Edit Tag Modal */}
			<TagModal
				tag={editingTag}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</PageShell>
	);
}
