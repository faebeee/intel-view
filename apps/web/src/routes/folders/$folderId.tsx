import type { ProjectResponseDto } from "@repo/sdk";
import {
	projectControllerRemove,
	projectFolderControllerRemove,
} from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import {
	PageHeader,
	PageShell,
	StatusBar,
} from "#/features/common/components/PageShell.tsx";
import { ProjectFolderModal } from "#/features/project-folders/components/ProjectFolderModal.tsx";
import { useProjectFolderQuery } from "#/features/project-folders/hooks/useProjectFolderQuery.ts";
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
import { ProjectTable } from "#/features/projects/components/ProjectTable.tsx";
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

	const isBusy = isProjectsLoading || isRefetching;
	const countLabel = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

	return (
		<PageShell
			contentClassName="px-8 pt-7 pb-10"
			header={
				<PageHeader
					crumbs={[{ label: "Folders", to: "/" }, { label: folder.name }]}
					title={folder.name}
					titlePrefix={
						<span
							aria-hidden="true"
							className="size-[9px] shrink-0"
							style={{
								background: folder.color,
								boxShadow: `0 0 10px ${folder.color}`,
							}}
						/>
					}
					titleSuffix={
						<>
							<span className="font-mono text-[11px] tracking-[0.1em] text-mc-text-2 uppercase">
								{countLabel}
							</span>
							<McButton
								variant="ghost"
								size="icon"
								aria-label="Edit folder"
								title="Edit folder"
								onClick={() => setIsEditFolderOpen(true)}
							>
								<Pencil className="size-4" strokeWidth={1.75} />
							</McButton>
						</>
					}
					actions={
						<>
							<ConfirmationButton
								onClick={() => removeFolderMutation.mutate()}
								title={`Delete folder "${folder.name}"?`}
								description={`Its ${countLabel} will move to Ungrouped. The projects themselves are not deleted.`}
								confirmText="Delete folder"
								trigger={
									<McButton
										variant="danger"
										disabled={removeFolderMutation.isPending}
									>
										<Trash2 strokeWidth={1.75} />
										Delete folder
									</McButton>
								}
							/>
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
								New project
							</McButton>
						</>
					}
				/>
			}
			status={<StatusBar items={[`Folder ${folder.name}`, countLabel]} />}
		>
			{isProjectsLoading && !isRefetching ? (
				<LoadingState label="Loading projects..." compact />
			) : (
				<ProjectTable
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
		</PageShell>
	);
}
