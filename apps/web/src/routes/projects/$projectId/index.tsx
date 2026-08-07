import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, StickyNote, Tag as TagIcon } from "lucide-react";
import type { JSX } from "react";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDashboardComponent,
});

function ProjectDashboardComponent(): JSX.Element {
	const { projectId } = Route.useParams();
	const id = parseInt(projectId, 10);
	const { data: project, isLoading } = useProjectQuery(id);

	if (isLoading) {
		return <LoadingState label="Loading project..." />;
	}

	if (!project) {
		return (
			<NotFoundState
				message={`Project #${projectId} not found.`}
				backTo="/"
				backLabel="Back to Projects"
			/>
		);
	}

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in">
			<div className="flex flex-col gap-1 border-b border-line pb-6">
				<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider font-mono">
					{project.name}
				</h1>
				<p className="text-xs text-muted-foreground">
					{project.description || "No description"}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<Link
					to="/projects/$projectId/map"
					params={{ projectId }}
					className="rounded-lg border border-line bg-surface-strong/80 backdrop-blur-md hover:border-palm/40 transition-colors p-6 flex flex-col items-center gap-3 no-underline text-inherit"
				>
					<MapIcon className="h-6 w-6 text-palm" />
					<span className="text-sm font-bold uppercase tracking-wider">
						Map
					</span>
				</Link>
				<Link
					to="/projects/$projectId/notes"
					params={{ projectId }}
					className="rounded-lg border border-line bg-surface-strong/80 backdrop-blur-md hover:border-palm/40 transition-colors p-6 flex flex-col items-center gap-3 no-underline text-inherit"
				>
					<StickyNote className="h-6 w-6 text-palm" />
					<span className="text-sm font-bold uppercase tracking-wider">
						Notes
					</span>
				</Link>
				<Link
					to="/projects/$projectId/tags"
					params={{ projectId }}
					className="rounded-lg border border-line bg-surface-strong/80 backdrop-blur-md hover:border-palm/40 transition-colors p-6 flex flex-col items-center gap-3 no-underline text-inherit"
				>
					<TagIcon className="h-6 w-6 text-palm" />
					<span className="text-sm font-bold uppercase tracking-wider">
						Tags
					</span>
				</Link>
			</div>
		</div>
	);
}
