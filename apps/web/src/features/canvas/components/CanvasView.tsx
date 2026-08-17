import * as React from "react";
// Import React Flow CSS once at the entry point of the Canvas component.
import "@xyflow/react/dist/style.css";
import type { CanvasViewContentProps } from "./CanvasViewContent";

const LazyCanvasViewContent = React.lazy(() => import("./CanvasViewContent"));

type CanvasViewProps = CanvasViewContentProps;

/**
 * Entry point for the project canvas view. Lazily loads the actual xyflow
 * implementation (and only after mounting on the client) so the canvas
 * never attempts to render during SSR, where `@xyflow/react` isn't usable.
 */
export function CanvasView(props: CanvasViewProps) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center bg-background font-mono text-xs text-muted-foreground p-4">
				<div className="animate-pulse">Loading canvas...</div>
			</div>
		);
	}

	return (
		<React.Suspense
			fallback={
				<div className="h-full w-full flex flex-col items-center justify-center bg-background font-mono text-xs text-muted-foreground p-4">
					<div className="animate-pulse">Loading canvas...</div>
				</div>
			}
		>
			<LazyCanvasViewContent {...props} />
		</React.Suspense>
	);
}
export default CanvasView;
