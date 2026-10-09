import type { ProjectResponseDto } from "@repo/sdk";
import {
	projectControllerRemove,
	projectFolderControllerRemove,
} from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { ProjectFolderModal } from "#/features/project-folders/components/ProjectFolderModal.tsx";
import { useProjectFolderQuery } from "#/features/project-folders/hooks/useProjectFolderQuery.ts";
import { ProjectGrid } from "#/features/projects/components/ProjectGrid.tsx";
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
import { useProjectsByFolderQuery } from "#/features/projects/hooks/useProjectsByFolderQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

export const Route = createFileRoute("/folders/$folderId")({
	component: FolderProjectsPage,
});

function FolderProjectsPage(): JSX.Element {
	const { folderId } = Route.useParams();
	const id = Number(folderId);
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: folder, isLoading: isFolderLoading } =
		useProjectFolderQuery(id);
	const {
		data: projects = [],
		isLoading: isProjectsLoading,
		isRefetching,
		refetch,
	} = useProjectsByFolderQuery(id);

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingProject, setEditingProject] =
		React.useState<ProjectResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);
	const [isEditFolderOpen, setIsEditFolderOpen] = React.useState(false);

	const removeProjectMutation = useMutation({
		mutationFn: async (projectId: number) => {
			const res = await projectControllerRemove({ path: { id: projectId } });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Project deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({ queryKey: ["project-folders"] });
		},
		onError: toastApiError("delete project"),
	});

	const removeFolderMutation = useMutation({
		mutationFn: async () => {
			const res = await projectFolderControllerRemove({ path: { id } });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Folder deleted. Its projects are now ungrouped.");
			queryClient.invalidateQueries({ queryKey: ["project-folders"] });
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			navigate({ to: "/" });
		},
		onError: toastApiError("delete folder"),
	});

	if (isFolderLoading) {
		return <LoadingState label="Loading folder..." />;
	}

	if (!folder) {
		return (
			<NotFoundState
				message="Folder not found."
				backTo="/"
				backLabel="Back to Folders"
			/>
		);
	}

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
				<div className="flex flex-col gap-1">
					<Link to="/" className="w-fit">
						<Button variant="outline" size="xs">
							<ArrowLeft className="h-3 w-3" />
							<span>Back to Folders</span>
						</Button>
					</Link>
					<div className="flex items-center gap-2 mt-1">
						<span
							className="size-3 rounded-full shrink-0 border border-black/30"
							style={{ backgroundColor: folder.color }}
						/>
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							{folder.name}
						</h1>
					</div>
					{folder.description && (
						<p className="text-xs text-muted-foreground">
							{folder.description}
						</p>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditFolderOpen(true)}
					>
						<Edit2 className="h-3 w-3" />
						<span>Edit Folder</span>
					</Button>

					<ConfirmationButton
						variant="outline"
						size="sm"
						onClick={() => removeFolderMutation.mutate()}
						disabled={removeFolderMutation.isPending}
						title="Delete Folder"
						description={`Are you sure you want to delete "${folder.name}"? Its projects will become ungrouped.`}
						confirmText="Delete"
					>
						<Trash2 className="h-3 w-3" />
						<span>Delete Folder</span>
					</ConfirmationButton>

					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isProjectsLoading || isRefetching}
					>
						<RefreshCw
							className={`h-3 w-3 ${isProjectsLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isProjectsLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>

					<Button
						variant="default"
						size="sm"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="h-4 w-4" />
						<span>New Project</span>
					</Button>
				</div>
			</div>

			{isProjectsLoading && !isRefetching ? (
				<LoadingState label="Loading projects..." compact />
			) : (
				<ProjectGrid
					projects={projects}
					emptyTitle="No projects in this folder"
					emptyDescription="Create a project to start adding notes and tags."
					onEdit={(project) => {
						setEditingProject(project);
						setIsEditOpen(true);
					}}
					onDelete={(project) => removeProjectMutation.mutate(project.id)}
					isDeleting={removeProjectMutation.isPending}
				/>
			)}

			{/* Create Project Modal (preselects this folder) */}
			<ProjectModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				defaultFolderId={id}
			/>

			{/* Edit Project Modal */}
			<ProjectModal
				project={editingProject}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>

			{/* Edit Folder Modal */}
			<ProjectFolderModal
				folder={folder}
				open={isEditFolderOpen}
				onOpenChange={setIsEditFolderOpen}
			/>
		</div>
	);
}
