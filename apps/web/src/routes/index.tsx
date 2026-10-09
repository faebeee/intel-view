import type { ProjectFolderResponseDto } from "@repo/sdk";
import { projectFolderControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FolderKanban, FolderPlus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { LoadingState } from "#/components/ui/loading-state.tsx";
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

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<FolderKanban className="h-5 w-5 text-palm" />
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							Folders
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Select a folder to see the projects inside it.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>

					<Button
						variant="default"
						size="sm"
						onClick={() => setIsCreateOpen(true)}
					>
						<FolderPlus className="h-4 w-4" />
						<span>New Folder</span>
					</Button>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<LoadingState label="Loading folders..." compact />
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{folders.map((folder) => (
						<FolderCard
							key={folder.id}
							to={`/folders/${folder.id}`}
							name={folder.name}
							description={folder.description}
							color={folder.color}
							projectsCount={folder.projectsCount}
							onEdit={() => handleEditClick(folder)}
							onDelete={() => removeFolderMutation.mutate(folder.id)}
							isDeleting={removeFolderMutation.isPending}
						/>
					))}
					<FolderCard
						to="/folders/ungrouped"
						name="Ungrouped"
						description="Projects not assigned to any folder."
						color="#64748b"
						projectsCount={ungroupedCount}
						isVirtual
					/>
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
		</div>
	);
}
