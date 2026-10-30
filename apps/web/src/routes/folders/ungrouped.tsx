import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerRemove } from "@repo/sdk";
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
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
import { ProjectTable } from "#/features/projects/components/ProjectTable.tsx";
import { useProjectsByFolderQuery } from "#/features/projects/hooks/useProjectsByFolderQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

export const Route = createFileRoute("/folders/ungrouped")({
	component: UngroupedProjectsPage,
});

function UngroupedProjectsPage(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: projects = [],
		isLoading,
		isRefetching,
		refetch,
	} = useProjectsByFolderQuery(null);

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingProject, setEditingProject] =
		React.useState<ProjectResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

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

	const isBusy = isLoading || isRefetching;
	const countLabel = `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

	return (
		<PageShell
			contentClassName="px-8 pt-7 pb-10"
			header={
				<PageHeader
					crumbs={[{ label: "Folders", to: "/" }, { label: "Ungrouped" }]}
					title="Ungrouped"
					titlePrefix={
						<span
							aria-hidden="true"
							className="size-[9px] shrink-0 bg-mc-text-muted"
						/>
					}
					titleSuffix={
						<span className="font-mono text-[11px] tracking-[0.1em] text-mc-text-2 uppercase">
							{countLabel}
						</span>
					}
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
								New project
							</McButton>
						</>
					}
				/>
			}
			status={<StatusBar items={["Ungrouped", countLabel]} />}
		>
			{isLoading && !isRefetching ? (
				<LoadingState label="Loading projects..." compact />
			) : (
				<ProjectTable
					projects={projects}
					emptyTitle="No ungrouped projects"
					emptyDescription="Every project is currently assigned to a folder."
					onEdit={(project) => {
						setEditingProject(project);
						setIsEditOpen(true);
					}}
					onDelete={(project) => removeProjectMutation.mutate(project.id)}
					isDeleting={removeProjectMutation.isPending}
				/>
			)}

			{/* Create Project Modal (no folder preselected => ungrouped) */}
			<ProjectModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Project Modal */}
			<ProjectModal
				project={editingProject}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</PageShell>
	);
}
