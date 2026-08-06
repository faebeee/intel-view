import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	Edit2,
	FolderKanban,
	FolderOpen,
	Plus,
	RefreshCw,
	Trash2,
} from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { CreateProjectModal } from "#/features/projects/components/CreateProjectModal.tsx";
import { EditProjectModal } from "#/features/projects/components/EditProjectModal.tsx";
import { useAllProjectsQuery } from "#/features/projects/hooks/useAllProjectsQuery.ts";

export const Route = createFileRoute("/")({ component: ProjectsOverview });

function ProjectsOverview(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: projects = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllProjectsQuery();

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingProject, setEditingProject] =
		React.useState<ProjectResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const removeProjectMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await projectControllerRemove({
				path: { id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Project deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
		},
		onError: (err) => {
			console.error("Failed to delete project:", err);
			toast.error("Failed to delete project", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleEditClick = (project: ProjectResponseDto) => {
		setEditingProject(project);
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
							Projects
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Select a project to manage its notes, tags, and map.
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

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-xs text-[#00f2ff]">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>Loading projects...</span>
					</div>
				</div>
			) : projects.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 text-center">
					<FolderKanban className="h-10 w-10 text-muted-foreground/40" />
					<div className="space-y-1">
						<p className="text-sm text-sea-ink font-bold">No projects yet</p>
						<p className="text-xs text-muted-foreground">
							Create your first project to start adding notes and tags.
						</p>
					</div>
					<Button
						variant="default"
						size="sm"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="h-4 w-4" />
						<span>New Project</span>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{projects.map((project) => {
						const createdDate = new Date(
							project.createdAt,
						).toLocaleDateString();
						return (
							<Card
								key={project.id}
								className="border-line bg-surface-strong/80 backdrop-blur-md hover:border-palm/40 transition-colors"
							>
								<CardHeader>
									<CardTitle className="text-base font-bold text-sea-ink font-mono truncate">
										{project.name}
									</CardTitle>
									<CardDescription className="text-xs line-clamp-2 min-h-[2rem]">
										{project.description || (
											<span className="italic text-muted-foreground/60">
												No description
											</span>
										)}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
										<Calendar className="h-3 w-3" />
										Created {createdDate}
									</span>
								</CardContent>
								<CardFooter className="flex items-center justify-between gap-2">
									<Link
										to="/projects/$projectId"
										params={{ projectId: String(project.id) }}
									>
										<Button variant="default" size="xs">
											<FolderOpen className="h-3 w-3" />
											<span>Open</span>
										</Button>
									</Link>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="xs"
											onClick={() => handleEditClick(project)}
										>
											<Edit2 className="h-3 w-3" />
											<span>Edit</span>
										</Button>
										<ConfirmationButton
											variant="outline"
											size="xs"
											onClick={() => removeProjectMutation.mutate(project.id)}
											disabled={removeProjectMutation.isPending}
											title="Delete Project"
											description={`Are you sure you want to permanently delete "${project.name}"? All of its notes and tags will be deleted too.`}
											confirmText="Delete"
										>
											<Trash2 className="h-3 w-3" />
											<span>Delete</span>
										</ConfirmationButton>
									</div>
								</CardFooter>
							</Card>
						);
					})}
				</div>
			)}

			{/* Create Project Modal */}
			<CreateProjectModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Project Modal */}
			<EditProjectModal
				project={editingProject}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</div>
	);
}
