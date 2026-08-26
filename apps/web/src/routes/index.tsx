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
	Settings2,
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
import { LoadingState } from "#/components/ui/loading-state.tsx";
import {
	NativeSelect,
	NativeSelectOption,
} from "#/components/ui/native-select.tsx";
import { TagChip } from "#/components/ui/tag-chip.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { ManageProjectGroupsModal } from "#/features/project-groups/components/ManageProjectGroupsModal.tsx";
import { useAllProjectGroupsQuery } from "#/features/project-groups/hooks/useAllProjectGroupsQuery.ts";
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
import { useAllProjectsQuery } from "#/features/projects/hooks/useAllProjectsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

const UNGROUPED_FILTER = "ungrouped";
const ALL_GROUPS_FILTER = "all";

export const Route = createFileRoute("/")({ component: ProjectsOverview });

function ProjectsOverview(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: projects = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllProjectsQuery();
	const { data: groups = [] } = useAllProjectGroupsQuery();

	const [groupFilter, setGroupFilter] = React.useState<string>(
		ALL_GROUPS_FILTER,
	);

	const filteredProjects = React.useMemo(() => {
		if (groupFilter === ALL_GROUPS_FILTER) return projects;
		if (groupFilter === UNGROUPED_FILTER) {
			return projects.filter((project) => project.groupId == null);
		}
		const groupId = Number(groupFilter);
		return projects.filter((project) => project.groupId === groupId);
	}, [projects, groupFilter]);

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingProject, setEditingProject] =
		React.useState<ProjectResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);
	const [isManageGroupsOpen, setIsManageGroupsOpen] = React.useState(false);


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
		onError: toastApiError("delete project"),
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
					<NativeSelect
						aria-label="Filter by group"
						size="sm"
						value={groupFilter}
						onChange={(e) => setGroupFilter(e.target.value)}
						className="text-xs"
					>
						<NativeSelectOption value={ALL_GROUPS_FILTER}>
							All Groups
						</NativeSelectOption>
						<NativeSelectOption value={UNGROUPED_FILTER}>
							Ungrouped
						</NativeSelectOption>
						{groups.map((group) => (
							<NativeSelectOption key={group.id} value={String(group.id)}>
								{group.name}
							</NativeSelectOption>
						))}
					</NativeSelect>

					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsManageGroupsOpen(true)}
					>
						<Settings2 className="h-3 w-3" />
						<span>Manage Groups</span>
					</Button>

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
				<LoadingState label="Loading projects..." compact />
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
			) : filteredProjects.length === 0 ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 text-center">
					<FolderKanban className="h-10 w-10 text-muted-foreground/40" />
					<div className="space-y-1">
						<p className="text-sm text-sea-ink font-bold">
							No projects in this group
						</p>
						<p className="text-xs text-muted-foreground">
							Try a different group filter, or assign a project to this group.
						</p>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredProjects.map((project) => {
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
						<CardContent className="flex flex-col gap-2">
							<span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
								<Calendar className="h-3 w-3" />
								Created {createdDate}
							</span>
							{project.group && (
								<span
									className="inline-flex items-center gap-1.5 self-start rounded-full border border-line/50 bg-surface/60 px-2 py-0.5 text-[10px] font-mono text-sea-ink"
								>
									<span
										className="size-2 rounded-full shrink-0"
										style={{ backgroundColor: project.group.color }}
									/>
								{project.group.name}
								</span>
							)}
							{project.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{project.tags.map((tag) => (
										<TagChip
											key={tag.id}
											tag={tag.name}
											color={tag.color}
											size="xs"
										/>
									))}
								</div>
							)}
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
			<ProjectModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Project Modal */}
			<ProjectModal
				project={editingProject}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>

			{/* Manage Groups Modal */}
			<ManageProjectGroupsModal
				open={isManageGroupsOpen}
				onOpenChange={setIsManageGroupsOpen}
			/>
		</div>
	);
}
