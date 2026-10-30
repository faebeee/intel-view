import { Link, useRouterState } from "@tanstack/react-router";
import { Folder, Moon, Sun, Tag as TagIcon, Waypoints } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useTheme } from "#/components/theme-provider.tsx";
import { cn } from "#/lib/utils.ts";

type AppRailProps = {
	/** Last opened project; the Canvas item links to it (disabled when unset). */
	canvasProjectId: string | null;
};

const ITEM_CLASS =
	"relative flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-rail)] text-mc-text-muted transition-colors hover:text-mc-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent";

const ACTIVE_CLASS = "text-mc-accent bg-mc-accent/8 hover:text-mc-accent";

function ActiveBar(): JSX.Element {
	return (
		<span
			aria-hidden="true"
			className="absolute -left-2.5 top-2.5 h-6 w-[3px] bg-mc-accent max-sm:left-2.5 max-sm:top-auto max-sm:-bottom-2 max-sm:h-[3px] max-sm:w-6"
		/>
	);
}

function RailLink({
	to,
	params,
	label,
	active,
	children,
}: {
	to: "/" | "/tags" | "/projects/$projectId";
	params?: { projectId: string };
	label: string;
	active: boolean;
	children: ReactNode;
}): JSX.Element {
	return (
		<Link
			to={to}
			params={params}
			aria-label={label}
			title={label}
			aria-current={active ? "page" : undefined}
			className={cn(ITEM_CLASS, active && ACTIVE_CLASS)}
		>
			{active && <ActiveBar />}
			{children}
		</Link>
	);
}

/**
 * 64px icon rail (developer handoff §03 "Rail") replacing the old top nav.
 * Becomes a bottom bar under 640px (§05 stopgap).
 */
export function AppRail({ canvasProjectId }: AppRailProps): JSX.Element {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const { resolvedMode, setMode } = useTheme();

	const isFolders = pathname === "/" || pathname.startsWith("/folders");
	const isCanvas = pathname.startsWith("/projects");
	const isTags = pathname.startsWith("/tags");
	const nextMode = resolvedMode === "dark" ? "light" : "dark";

	return (
		<nav
			aria-label="Main"
			className="flex w-[var(--rail-w)] shrink-0 flex-col items-center gap-1.5 border-r border-mc-border bg-mc-rail py-3.5 max-sm:h-16 max-sm:w-full max-sm:flex-row max-sm:justify-around max-sm:border-r-0 max-sm:border-t max-sm:px-2 max-sm:py-0"
		>
			<span className="focus-wrap mb-3.5 inline-flex max-sm:hidden">
				<Link
					to="/"
					aria-label="Home"
					className="flex size-10 items-center justify-center bg-mc-accent font-mono text-sm font-semibold text-mc-on-accent outline-none [clip-path:polygon(0_0,100%_0,100%_70%,70%_100%,0_100%)]"
				>
					&gt;_
				</Link>
			</span>

			<RailLink to="/" label="Folders" active={isFolders}>
				<Folder className="size-5" strokeWidth={1.6} />
			</RailLink>

			{canvasProjectId ? (
				<RailLink
					to="/projects/$projectId"
					params={{ projectId: canvasProjectId }}
					label="Canvas"
					active={isCanvas}
				>
					<Waypoints className="size-5" strokeWidth={1.6} />
				</RailLink>
			) : (
				<span
					role="img"
					aria-label="Canvas (open a project first)"
					title="Open a project first"
					className={cn(
						ITEM_CLASS,
						"cursor-not-allowed opacity-40 hover:text-mc-text-muted",
					)}
				>
					<Waypoints className="size-5" strokeWidth={1.6} />
				</span>
			)}

			<RailLink to="/tags" label="Tags" active={isTags}>
				<TagIcon className="size-5" strokeWidth={1.6} />
			</RailLink>

			<div className="flex-1 max-sm:hidden" />

			<button
				type="button"
				onClick={() => setMode(nextMode)}
				aria-label={`Switch to ${nextMode} theme`}
				title={`Switch to ${nextMode} theme`}
				className={cn(ITEM_CLASS, "cursor-pointer")}
			>
				{resolvedMode === "dark" ? (
					<Moon className="size-[18px]" strokeWidth={1.6} />
				) : (
					<Sun className="size-[18px]" strokeWidth={1.6} />
				)}
			</button>
		</nav>
	);
}
