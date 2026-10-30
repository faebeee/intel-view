import { useIsFetching } from "@tanstack/react-query";
import { Link, type LinkProps } from "@tanstack/react-router";
import type { JSX, ReactNode } from "react";
import { Fragment } from "react";
import { cn } from "#/lib/utils.ts";

export type Crumb = {
	label: string;
	/** Omit for the current (last) crumb. */
	to?: LinkProps["to"];
	params?: LinkProps["params"];
};

type PageHeaderProps = {
	/** Small caps line above the title (e.g. "WORKSPACE"); ignored when `crumbs` is set. */
	kicker?: string;
	crumbs?: Crumb[];
	title: ReactNode;
	/** Rendered before the title (e.g. the folder color square). */
	titlePrefix?: ReactNode;
	/** Rendered after the title (e.g. project count, edit button). */
	titleSuffix?: ReactNode;
	actions?: ReactNode;
	className?: string;
};

/** Page header (handoff §01): rail background, 1px bottom border, caps title. */
export function PageHeader({
	kicker,
	crumbs,
	title,
	titlePrefix,
	titleSuffix,
	actions,
	className,
}: PageHeaderProps): JSX.Element {
	return (
		<header
			className={cn(
				"shrink-0 border-b border-mc-border bg-mc-rail px-8 py-4 max-sm:px-4",
				className,
			)}
		>
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex min-w-0 flex-col gap-1">
					{crumbs ? (
						<nav
							aria-label="Breadcrumb"
							className="flex flex-wrap gap-2 font-mono text-[11px] tracking-[0.08em] text-mc-text-muted uppercase"
						>
							{crumbs.map((crumb, index) => (
								<Fragment key={`${crumb.label}:${String(crumb.to ?? "")}`}>
									{index > 0 && <span aria-hidden="true">{"//"}</span>}
									{crumb.to ? (
										<Link
											to={crumb.to}
											params={crumb.params}
											className="text-mc-text-2 no-underline hover:text-mc-text focus-visible:outline-2 focus-visible:outline-mc-accent"
										>
											{crumb.label}
										</Link>
									) : (
										<span aria-current="page" className="text-mc-text">
											{crumb.label}
										</span>
									)}
								</Fragment>
							))}
						</nav>
					) : kicker ? (
						<span className="font-mono text-[11px] tracking-[0.08em] text-mc-text-muted uppercase">
							{kicker}
						</span>
					) : null}
					<div className="flex flex-wrap items-center gap-3">
						{titlePrefix}
						<h1 className="m-0 min-w-0 break-words font-display text-[30px] leading-[1.1] font-semibold tracking-[0.01em] uppercase">
							{title}
						</h1>
						{titleSuffix}
					</div>
				</div>
				<div className="flex-1" />
				{actions && (
					<div className="flex flex-wrap items-center gap-3">{actions}</div>
				)}
			</div>
		</header>
	);
}

type StatusBarProps = {
	/** Context-specific segments (counts etc.), rendered after the sync state. */
	items?: ReactNode[];
	/** Right-aligned segment (e.g. last update). */
	right?: ReactNode;
};

/** 30px status bar (handoff §03): sync state + per-screen counts. */
export function StatusBar({ items = [], right }: StatusBarProps): JSX.Element {
	const fetching = useIsFetching();

	return (
		<footer className="flex h-[var(--status-h)] shrink-0 items-center gap-5 overflow-hidden border-t border-mc-border bg-mc-rail px-4 font-mono text-[10.5px] tracking-[0.08em] whitespace-nowrap text-mc-text-muted uppercase">
			<output
				className="flex items-center gap-1.5 text-mc-accent"
				aria-live="polite"
			>
				<span
					aria-hidden="true"
					className={cn(
						"size-1.5 rounded-full bg-mc-accent",
						fetching > 0 && "mc-pulse",
					)}
				/>
				{fetching > 0 ? "Syncing" : "Synced"}
			</output>
			{items.map((item, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static, positional segments
				<span key={index}>{item}</span>
			))}
			{right && (
				<>
					<span className="flex-1" />
					<span>{right}</span>
				</>
			)}
		</footer>
	);
}

type PageShellProps = {
	header: ReactNode;
	status: ReactNode;
	children: ReactNode;
	/** Classes for the scrolling content area (defaults to padded blueprint grid). */
	contentClassName?: string;
};

/** Header + blueprint-grid content area + status bar, shared by every screen. */
export function PageShell({
	header,
	status,
	children,
	contentClassName,
}: PageShellProps): JSX.Element {
	return (
		<div className="flex h-full min-h-0 flex-col">
			{header}
			<div
				className={cn(
					"bg-blueprint min-h-0 flex-1 overflow-y-auto p-8 max-sm:p-4",
					contentClassName,
				)}
			>
				{children}
			</div>
			{status}
		</div>
	);
}
