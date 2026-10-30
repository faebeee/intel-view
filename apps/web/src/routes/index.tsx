import type { ProjectFolderResponseDto } from "@repo/sdk";
import { projectFolderControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import {
	PageHeader,
	PageShell,
	StatusBar,
} from "#/features/common/components/PageShell.tsx";
import { FolderCard } from "#/features/project-folders/components/FolderCard.tsx";
import { ProjectFolderModal } from "#/features/project-folders/components/ProjectFolderModal.tsx";
import { useAllProjectFoldersQuery } from "#/features/project-folders/hooks/useAllProjectFoldersQuery.ts";
import { useUngroupedCountQuery } from "#/features/project-folders/hooks/useUngroupedCountQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

export const Route = createFileRoute("/")({ component: FoldersOverview });

function FoldersOverview(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: folders = [],
		isLoading,
		isRefetching,
		refetch: refetchFolders,
	} = useAllProjectFoldersQuery();
	const { data: ungroupedCount = 0, refetch: refetchUngroupedCount } =
		useUngroupedCountQuery();

	const refetch = () => {
		refetchFolders();
		refetchUngroupedCount();
	};

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingFolder, setEditingFolder] =
		React.useState<ProjectFolderResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const removeFolderMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await projectFolderControllerRemove({ path: { id } });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Folder deleted. Its projects are now ungrouped.");
			queryClient.invalidateQueries({ queryKey: ["project-folders"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: toastApiError("delete folder"),
	});

	const handleEditClick = (folder: ProjectFolderResponseDto) => {
		setEditingFolder(folder);
		setIsEditOpen(true);
	};

	const isBusy = isLoading || isRefetching;
	const totalProjects =
		folders.reduce((sum, folder) => sum + folder.projectsCount, 0) +
		ungroupedCount;
	const busiestCount = Math.max(0, ...folders.map((f) => f.projectsCount));

	return (
		<PageShell
			header={
				<PageHeader
					kicker="Workspace"
					title="Folders"
					actions={
						<>
							<McButton
								variant="icon"
								size="icon-md"
								onClick={() => refetch()}
								disabled={isBusy}
								aria-label="Refresh"
								title="Refresh"
							>
								<RefreshCw className={isBusy ? "animate-spin" : ""} />
							</McButton>
							<McButton variant="primary" onClick={() => setIsCreateOpen(true)}>
								<Plus strokeWidth={2.2} />
								New folder
							</McButton>
						</>
					}
				/>
			}
			status={
				<StatusBar
					items={[
						`${folders.length} ${folders.length === 1 ? "folder" : "folders"}`,
						`${totalProjects} ${totalProjects === 1 ? "project" : "projects"}`,
					]}
				/>
			}
		>
			{isLoading && !isRefetching ? (
				<LoadingState label="Loading folders..." compact />
			) : (
				<div className="grid max-w-[1320px] grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-5">
					{folders.map((folder) => (
						<FolderCard
							key={folder.id}
							to={`/folders/${folder.id}`}
							name={folder.name}
							description={folder.description}
							color={folder.color}
							projectsCount={folder.projectsCount}
							highlighted={
								busiestCount > 0 && folder.projectsCount === busiestCount
							}
							onEdit={() => handleEditClick(folder)}
							onDelete={() => removeFolderMutation.mutate(folder.id)}
							isDeleting={removeFolderMutation.isPending}
						/>
					))}
					<FolderCard
						to="/folders/ungrouped"
						name="Ungrouped"
						description="Projects not assigned to any folder."
						color="var(--mc-text-muted)"
						projectsCount={ungroupedCount}
						isVirtual
					/>
					<button
						type="button"
						onClick={() => setIsCreateOpen(true)}
						className="flex min-h-[222px] cursor-pointer flex-col items-center justify-center gap-2.5 border border-dashed border-mc-border-strong bg-mc-panel/50 font-mono text-xs tracking-[0.12em] text-mc-text-2 uppercase transition-colors hover:border-mc-edge-idle hover:text-mc-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
					>
						<Plus className="size-5" strokeWidth={1.6} />
						New folder
					</button>
				</div>
			)}

			{/* Create Folder Modal */}
			<ProjectFolderModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Folder Modal */}
			<ProjectFolderModal
				folder={editingFolder}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</PageShell>
	);
}
