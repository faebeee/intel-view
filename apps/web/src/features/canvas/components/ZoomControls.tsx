import { useReactFlow, useViewport } from "@xyflow/react";
import { Maximize, Minus, Plus } from "lucide-react";
import type { JSX } from "react";
import { cn } from "#/lib/utils.ts";

const BUTTON_CLASS =
	"flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent text-mc-text-2 transition-colors hover:text-mc-text focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mc-accent";

/**
 * Zoom group from the canvas artboard (44px buttons, live zoom %). The
 * artboard's fourth button is auto-arrange (handoff §04, not built); this
 * slot keeps the existing "fit view" action instead.
 */
export function ZoomControls(): JSX.Element {
	const { zoomIn, zoomOut, fitView } = useReactFlow();
	const { zoom } = useViewport();

	return (
		// biome-ignore lint/a11y/useSemanticElements: a toolbar-style button group, not a form fieldset
		<div
			role="group"
			aria-label="Zoom"
			className="flex items-center border border-mc-border-strong bg-mc-panel/92 backdrop-blur-sm"
		>
			<button
				type="button"
				aria-label="Zoom out"
				title="Zoom out"
				onClick={() => zoomOut({ duration: 150 })}
				className={BUTTON_CLASS}
			>
				<Minus className="size-4" strokeWidth={2} />
			</button>
			<output
				aria-live="polite"
				aria-label="Zoom level"
				className="min-w-12 text-center font-mono text-[11.5px] text-mc-text-2"
			>
				{Math.round(zoom * 100)}%
			</output>
			<button
				type="button"
				aria-label="Zoom in"
				title="Zoom in"
				onClick={() => zoomIn({ duration: 150 })}
				className={BUTTON_CLASS}
			>
				<Plus className="size-4" strokeWidth={2} />
			</button>
			<button
				type="button"
				aria-label="Fit all notes in view"
				title="Fit view"
				onClick={() => fitView({ duration: 200 })}
				className={cn(BUTTON_CLASS, "border-l border-mc-border-strong")}
			>
				<Maximize className="size-4" strokeWidth={1.75} />
			</button>
		</div>
	);
}
