import { Link, useParams } from "@tanstack/react-router";
import { FolderKanban, Tag as TagIcon, Waypoints } from "lucide-react";
import type { JSX, ReactNode } from "react";
import ParaglideLocaleSwitcher from "../../../components/LocaleSwitcher";
import { ThemeSwitcher } from "../../../components/theme-switcher";
import { useProjectQuery } from "../../projects/hooks/useProjectQuery";

type LayoutProps = {
	children: ReactNode;
};

export function Layout({ children }: LayoutProps): JSX.Element {
	const { projectId: projectIdParam } = useParams({ strict: false });
	const projectId = projectIdParam ? parseInt(projectIdParam, 10) : NaN;
	const { data: project } = useProjectQuery(projectId);

	return (
		<div className="flex flex-col min-h-screen w-full bg-background text-foreground overflow-hidden">
			{/* Small Header */}
			<header className="sticky top-0 z-40 w-full h-16 border-b border-line bg-header-bg backdrop-blur-md shrink-0">
				<div className="page-wrap h-full grid grid-cols-[auto_1fr_auto] items-center gap-4">
					<div className="min-w-0 flex items-center gap-6">
						<Link
							to="/"
							className="nav-link text-sm font-bold flex items-center gap-1.5"
						>
							<FolderKanban className="w-4 h-4" />
							<span>{project?.name || "Projects"}</span>
						</Link>
						<Link
							to="/tags"
							className="nav-link text-sm font-bold flex items-center gap-1.5"
							activeProps={{ className: "is-active" }}
						>
							<TagIcon className="w-4 h-4" />
							<span>Tags</span>
						</Link>
					</div>

					{projectIdParam ? (
						<nav className="justify-self-center flex items-center gap-6">
							<Link
								to="/projects/$projectId"
								params={{ projectId: projectIdParam }}
								className="nav-link text-sm font-bold flex items-center gap-1.5"
								activeProps={{ className: "is-active" }}
							>
								<Waypoints className="w-4 h-4" />
								<span>Canvas</span>
							</Link>
						</nav>
					) : (
						<div />
					)}

					<div className="flex items-center justify-self-end gap-3">
						<ThemeSwitcher />
						<ParaglideLocaleSwitcher />
					</div>
				</div>
			</header>

			{/* Large Fullscreen Main Area */}
			<main className="flex-1 w-full min-h-0 overflow-y-auto">{children}</main>
		</div>
	);
}
