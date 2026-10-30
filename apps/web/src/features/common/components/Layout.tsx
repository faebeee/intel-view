import { useParams } from "@tanstack/react-router";
import type { JSX, ReactNode } from "react";
import { useEffect, useState } from "react";
import { readLastProjectId, writeLastProjectId } from "#/lib/last-project.ts";
import { AppRail } from "./AppRail";

type LayoutProps = {
	children: ReactNode;
};

/**
 * App shell: the icon rail plus a full-height content column. Each screen
 * renders its own header and status bar (see `PageShell`) because both are
 * context-aware.
 */
export function Layout({ children }: LayoutProps): JSX.Element {
	const { projectId: projectIdParam } = useParams({ strict: false });

	// The rail's Canvas item reopens the last visited project.
	const [lastProjectId, setLastProjectId] = useState<string | null>(null);

	useEffect(() => {
		if (projectIdParam) {
			setLastProjectId(projectIdParam);
			writeLastProjectId(projectIdParam);
		} else {
			setLastProjectId((current) => current ?? readLastProjectId());
		}
	}, [projectIdParam]);

	return (
		<div className="flex h-dvh w-full overflow-hidden bg-mc-bg text-mc-text max-sm:flex-col-reverse">
			<AppRail canvasProjectId={lastProjectId} />
			<main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
