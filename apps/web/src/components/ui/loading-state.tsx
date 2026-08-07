import type { LinkProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "#/components/ui/button.tsx";
import { cn } from "#/lib/utils.ts";

type LoadingStateProps = {
	label?: string;
	/** Use the shorter, list-page variant of vertical padding (`py-20` vs `py-40`). */
	compact?: boolean;
};

/**
 * Full-bleed "pulse" loading indicator shared by every route/panel that
 * fetches a single resource or list before rendering (notes, projects,
 * tags, ...).
 */
export function LoadingState({
	label = "Loading...",
	compact = false,
}: LoadingStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center font-mono text-xs text-[#00f2ff]",
				compact
					? "flex-1 py-20"
					: "min-h-full w-full bg-background/50 p-6 py-40",
			)}
		>
			<div className="animate-pulse flex flex-col items-center gap-2">
				<span>{label}</span>
			</div>
		</div>
	);
}

type NotFoundStateProps<TTo extends string> = {
	message: string;
	backTo: LinkProps<TTo>["to"];
	backParams?: LinkProps<TTo>["params"];
	backLabel?: string;
};

/**
 * "Resource not found" state (red message + a button back to a listing
 * route) shared by note/project detail routes.
 */
export function NotFoundState<TTo extends string>({
	message,
	backTo,
	backParams,
	backLabel = "Go Back",
}: NotFoundStateProps<TTo>) {
	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col items-center justify-center py-40 gap-4">
			<p className="font-mono text-xs text-red-400">{message}</p>
			<Link to={backTo} params={backParams}>
				<Button variant="outline" size="sm">
					<ArrowLeft className="h-3 w-3" />
					<span>{backLabel}</span>
				</Button>
			</Link>
		</div>
	);
}
