import * as React from "react";
// Import Leaflet CSS once at the entry point of the Map component
import "leaflet/dist/leaflet.css";

const LazyMapViewContent = React.lazy(() => import("./MapViewContent"));

type MapViewProps = {
	projectId: number;
};

export function MapView({ projectId }: MapViewProps) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center bg-[#030712] font-mono text-xs text-[#00f2ff] p-4">
				<div className="animate-pulse flex flex-col items-center gap-2">
					<span>INITIALIZING SECURE LINK...</span>
				</div>
			</div>
		);
	}

	return (
		<React.Suspense
			fallback={
				<div className="h-full w-full flex flex-col items-center justify-center bg-[#030712] font-mono text-xs text-[#00f2ff] p-4">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>BOOTING GEOSPATIAL SYSTEMS...</span>
					</div>
				</div>
			}
		>
			<LazyMapViewContent projectId={projectId} />
		</React.Suspense>
	);
}
export default MapView;
