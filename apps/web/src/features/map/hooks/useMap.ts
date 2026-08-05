import * as React from "react";
import { MapContext } from "../components/MapProvider";

export function useMap() {
	const context = React.useContext(MapContext);
	if (context === undefined) {
		throw new Error("useMap must be used within a MapProvider");
	}
	return context;
}
