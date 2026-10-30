import type { LinkProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "#/lib/utils.ts";

type CornerFrameProps = {
	children: ReactNode;
	tone?: "accent" | "danger";
	className?: string;
};

/**
 * 64px square with corner brackets, taken from the Tags empty state and
 * reused for every loading / error / empty state (handoff §05).
 */
export function CornerFrame({
	children,
	tone = "accent",
	className,
}: CornerFrameProps) {
	const line = tone === "danger" ? "border-mc-danger" : "border-mc-accent";
	return (
		<div
			aria-hidden="true"
			className={cn(
				"relative flex size-16 shrink-0 items-center justify-center text-mc-text-muted",
				className,
			)}
		>
			<span
				className={cn("absolute top-0 left-0 size-3 border-t border-l", line)}
			/>
			<span
				className={cn("absolute top-0 right-0 size-3 border-t border-r", line)}
			/>
			<span
				className={cn(
					"absolute bottom-0 left-0 size-3 border-b border-l",
					line,
				)}
			/>
			<span
				className={cn(
					"absolute right-0 bottom-0 size-3 border-r border-b",
					line,
				)}
			/>
			{children}
		</div>
	);
}

type StatePanelProps = {
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	tone?: "accent" | "danger";
	className?: string;
};

/** Centered frame + caps title + body copy + optional action. */
export function StatePanel({
	icon,
	title,
	description,
	action,
	tone = "accent",
	className,
}: StatePanelProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3.5 px-6 py-20 text-center",
				className,
			)}
		>
			<CornerFrame tone={tone}>{icon}</CornerFrame>
			<h3
				className={cn(
					"m-0 font-display text-lg font-semibold tracking-[0.04em] uppercase",
					tone === "danger" && "text-mc-danger-text",
				)}
			>
				{title}
			</h3>
			{description && (
				<p className="m-0 max-w-[380px] leading-relaxed text-mc-text-2">
					{description}
				</p>
			)}
			{action}
		</div>
	);
}

type LoadingStateProps = {
	label?: string;
	/** Use the shorter, list-page variant of vertical padding. */
	compact?: boolean;
};

/**
 * Loading indicator shared by every route/panel that fetches a single
 * resource or list before rendering (notes, projects, tags, ...).
 */
export function LoadingState({
	label = "Loading...",
	compact = false,
}: LoadingStateProps) {
	return (
		<output
			className={cn(
				"flex flex-col items-center justify-center gap-3.5",
				compact ? "flex-1 py-20" : "min-h-full w-full p-6 py-40",
			)}
		>
			<CornerFrame>
				<span className="mc-pulse size-2 bg-mc-accent" />
			</CornerFrame>
			<span className="font-mono text-[11px] tracking-[0.12em] text-mc-text-muted uppercase">
				{label}
			</span>
		</output>
	);
}

type NotFoundStateProps<TTo extends string> = {
	message: string;
	backTo: LinkProps<TTo>["to"];
	backParams?: LinkProps<TTo>["params"];
	backLabel?: string;
};

/**
 * "Resource not found" state (message + a link back to a listing route)
 * shared by note/project detail routes.
 */
export function NotFoundState<TTo extends string>({
	message,
	backTo,
	backParams,
	backLabel = "Go Back",
}: NotFoundStateProps<TTo>) {
	return (
		<StatePanel
			tone="danger"
			title="Not found"
			description={message}
			className="min-h-full py-40"
			action={
				<Link
					to={backTo}
					params={backParams}
					className="flex h-11 items-center gap-2 border border-mc-border-strong px-4 font-mono text-[11.5px] tracking-[0.1em] text-mc-text no-underline uppercase hover:border-mc-edge-idle hover:bg-mc-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
				>
					<ArrowLeft className="size-4" />
					{backLabel}
				</Link>
			}
		/>
	);
}
