import type { EdgeProps, InternalNode, Node } from "@xyflow/react";
import {
	BaseEdge,
	getBezierPath,
	Position,
	useInternalNode,
} from "@xyflow/react";
import type { JSX } from "react";

export type LinkEdgeData = {
	edgeKind: "hierarchy";
	/** True when either end is the selected note. */
	active?: boolean;
};

type Anchor = { x: number; y: number; position: Position };

/**
 * Picks the port on each node facing the other one: left/right when the
 * nodes sit mostly side by side, top/bottom when stacked. Keeps links short
 * on a free-form canvas instead of always leaving from the bottom handle.
 */
function getAnchors(
	source: InternalNode<Node>,
	target: InternalNode<Node>,
): [Anchor, Anchor] {
	const sw = source.measured.width ?? 160;
	const sh = source.measured.height ?? 96;
	const tw = target.measured.width ?? 160;
	const th = target.measured.height ?? 96;
	const s = source.internals.positionAbsolute;
	const t = target.internals.positionAbsolute;
	const dx = t.x + tw / 2 - (s.x + sw / 2);
	const dy = t.y + th / 2 - (s.y + sh / 2);

	if (Math.abs(dx) * ((sh + th) / (sw + tw)) > Math.abs(dy)) {
		const right = dx > 0;
		return [
			{
				x: right ? s.x + sw : s.x,
				y: s.y + sh / 2,
				position: right ? Position.Right : Position.Left,
			},
			{
				x: right ? t.x : t.x + tw,
				y: t.y + th / 2,
				position: right ? Position.Left : Position.Right,
			},
		];
	}
	const down = dy > 0;
	return [
		{
			x: s.x + sw / 2,
			y: down ? s.y + sh : s.y,
			position: down ? Position.Bottom : Position.Top,
		},
		{
			x: t.x + tw / 2,
			y: down ? t.y : t.y + th,
			position: down ? Position.Top : Position.Bottom,
		},
	];
}

/**
 * Link between two notes (handoff §03 "Link"): a cubic bezier between the
 * facing node ports. Idle links are thin and muted; links touching the selected
 * note turn accent and flow (the dash animation stops under
 * prefers-reduced-motion, see `.mc-flow` in styles.css).
 */
export function LinkEdge({
	id,
	source,
	target,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
	selected,
	markerEnd,
}: EdgeProps & { data?: LinkEdgeData }): JSX.Element {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);
	const [from, to] =
		sourceNode && targetNode
			? getAnchors(sourceNode, targetNode)
			: [
					{ x: sourceX, y: sourceY, position: sourcePosition },
					{ x: targetX, y: targetY, position: targetPosition },
				];
	const [path] = getBezierPath({
		sourceX: from.x,
		sourceY: from.y,
		sourcePosition: from.position,
		targetX: to.x,
		targetY: to.y,
		targetPosition: to.position,
	});
	const active = data?.active ?? false;

	return (
		<BaseEdge
			id={id}
			path={path}
			markerEnd={markerEnd}
			className={active ? "mc-flow" : undefined}
			style={{
				stroke: active
					? "var(--mc-accent)"
					: selected
						? "var(--mc-text-2)"
						: "var(--mc-edge-idle)",
				strokeWidth: active || selected ? 2 : 1.5,
			}}
		/>
	);
}
