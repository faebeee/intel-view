import * as React from "react";
// Import React Flow CSS once at the entry point of the Canvas component.
import "@xyflow/react/dist/style.css";

const LazyCanvasViewContent = React.lazy(() => import("./CanvasViewContent"));

type CanvasViewProps = {
	projectId: number;
};

export function CanvasView({ projectId }: CanvasViewProps) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center bg-background font-mono text-xs text-lagoon p-4">
				<div className="animate-pulse flex flex-col items-center gap-2">
					<span>INITIALIZING SECURE LINK...</span>
				</div>
			</div>
		);
	}

	return (
		<React.Suspense
			fallback={
				<div className="h-full w-full flex flex-col items-center justify-center bg-background font-mono text-xs text-lagoon p-4">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>BOOTING GRAPH SYSTEMS...</span>
					</div>
				</div>
			}
		>
			<LazyCanvasViewContent projectId={projectId} />
		</React.Suspense>
	);
}
export default CanvasView;
