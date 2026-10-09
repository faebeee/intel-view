import type { ProjectResponseDto } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import {
	Calendar,
	Edit2,
	FolderKanban,
	FolderOpen,
	Trash2,
} from "lucide-react";
import type { JSX } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { ProjectColorBadge } from "#/features/projects/components/ProjectColorBadge.tsx";

type ProjectGridProps = {
	projects: ProjectResponseDto[];
	emptyTitle?: string;
	emptyDescription?: string;
	onEdit: (project: ProjectResponseDto) => void;
	onDelete: (project: ProjectResponseDto) => void;
	isDeleting?: boolean;
};

/**
 * Grid of project cards shared by every folder-detail route (a real folder,
 * or the synthetic "Ungrouped" folder). Open/Edit/Delete actions mirror the
 * ones that used to live directly on the dashboard before it became
 * folder-first.
 */
export function ProjectGrid({
	projects,
	emptyTitle = "No projects yet",
	emptyDescription = "Create a project to start adding notes and tags.",
	onEdit,
	onDelete,
	isDeleting = false,
}: ProjectGridProps): JSX.Element {
	if (projects.length === 0) {
		return (
			<div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 text-center">
				<FolderKanban className="h-10 w-10 text-muted-foreground/40" />
				<div className="space-y-1">
					<p className="text-sm text-sea-ink font-bold">{emptyTitle}</p>
					<p className="text-xs text-muted-foreground">{emptyDescription}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{projects.map((project) => {
				const createdDate = new Date(project.createdAt).toLocaleDateString();
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
							<div className="flex flex-wrap gap-1.5">
								<ProjectColorBadge color={project.color} />
							</div>
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
									onClick={() => onEdit(project)}
								>
									<Edit2 className="h-3 w-3" />
									<span>Edit</span>
								</Button>
								<ConfirmationButton
									variant="outline"
									size="xs"
									onClick={() => onDelete(project)}
									disabled={isDeleting}
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
	);
}
