import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { ProjectGrid } from "#/features/projects/components/ProjectGrid.tsx";
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
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
						<span className="size-3 rounded-full shrink-0 border border-black/30 bg-slate-500" />
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							Ungrouped
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Projects not assigned to any folder.
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
						<Plus className="h-4 w-4" />
						<span>New Project</span>
					</Button>
				</div>
			</div>

			{isLoading && !isRefetching ? (
				<LoadingState label="Loading projects..." compact />
			) : (
				<ProjectGrid
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
		</div>
	);
}
