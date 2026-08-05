import { Link } from "@tanstack/react-router";
import { Map as MapIcon, StickyNote, Tag as TagIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import ParaglideLocaleSwitcher from "../../../components/LocaleSwitcher";

type LayoutProps = {
	children: ReactNode;
};

export function Layout({ children }: LayoutProps): JSX.Element {
	return (
		<div className="flex flex-col min-h-screen w-full bg-background text-foreground overflow-hidden">
			{/* Small Header */}
			<header className="sticky top-0 z-40 w-full h-16 border-b border-line bg-header-bg backdrop-blur-md shrink-0">
				<div className="page-wrap h-full flex items-center justify-between gap-4">
					<Link
						to="/"
						className="flex items-center gap-2 text-inherit no-underline"
					>
						<StickyNote className="w-6 h-6 text-palm" />
					</Link>

					<nav className="flex items-center gap-6">
						<Link
							to="/map"
							className="nav-link text-sm font-bold flex items-center gap-1.5"
							activeProps={{ className: "is-active" }}
						>
							<MapIcon className="w-4 h-4" />
							<span>Map</span>
						</Link>
						<Link
							to="/notes"
							className="nav-link text-sm font-bold flex items-center gap-1.5"
							activeProps={{ className: "is-active" }}
						>
							<StickyNote className="w-4 h-4" />
							<span>Notes</span>
						</Link>
						<Link
							to="/tags"
							className="nav-link text-sm font-bold flex items-center gap-1.5"
							activeProps={{ className: "is-active" }}
						>
							<TagIcon className="w-4 h-4" />
							<span>Tags</span>
						</Link>
					</nav>

					<div className="flex items-center gap-3">
						<ParaglideLocaleSwitcher />
					</div>
				</div>
			</header>

			{/* Large Fullscreen Main Area */}
			<main className="flex-1 w-full min-h-0 overflow-y-auto">{children}</main>
		</div>
	);
}
