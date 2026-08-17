import type { Connection, Edge, Node, NodeChange } from "@xyflow/react";
import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	Controls,
	MiniMap,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import { PlusCircle, RefreshCw } from "lucide-react";
import * as React from "react";
import { useTheme } from "#/components/theme-provider.tsx";
import { Button } from "#/components/ui/button.tsx";
import { extractNoteReferenceIds } from "#/lib/note-references.ts";
import type { NoteType } from "#/types/note.ts";
import { useCanvasNotesQuery } from "../hooks/useCanvasNotesQuery";
import { useCreateInlineNote } from "../hooks/useCreateInlineNote";
import { useDeleteNote } from "../hooks/useDeleteNote";
import { useUpdateNote } from "../hooks/useUpdateNote";
import {
	CANVAS_GRID_CELL_HEIGHT,
	CANVAS_GRID_CELL_WIDTH,
	CANVAS_GRID_COLUMNS,
	type NoteNodeData,
} from "../types";
import { InlineNoteCard } from "./InlineNoteCard";
import { NoteNode } from "./NoteNode";

const nodeTypes = {
	noteNode: NoteNode,
	inlineNoteDraft: InlineNoteDraftNode,
};

type DraftNote = {
	id: string;
	x: number;
	y: number;
};

function InlineNoteDraftNode({
	data,
}: {
	data: {
		pending: boolean;
		onSave: (payload: { type: NoteType; content: string }) => void;
		onCancel: () => void;
	};
}) {
	return (
		<InlineNoteCard
			pending={data.pending}
			onSave={data.onSave}
			onCancel={data.onCancel}
		/>
	);
}

function gridPosition(index: number): { x: number; y: number } {
	const col = index % CANVAS_GRID_COLUMNS;
	const row = Math.floor(index / CANVAS_GRID_COLUMNS);
	return {
		x: col * CANVAS_GRID_CELL_WIDTH,
		y: row * CANVAS_GRID_CELL_HEIGHT,
	};
}

export type CanvasViewContentProps = {
	projectId: number;
	selectedNoteId: number | null;
	onSelectNote: (noteId: number | null) => void;
};

function CanvasInnerView({
	projectId,
	selectedNoteId,
	onSelectNote,
}: CanvasViewContentProps) {
	const { resolvedMode } = useTheme();
	const { data, isLoading, refetch } = useCanvasNotesQuery(projectId);
	// Stabilize the notes reference: `data` only changes identity when the
	// query result actually changes, whereas a `data = []` default parameter
	// would create a new array on every render and cause effects/memos keyed
	// on it to re-run indefinitely.
	const notes = React.useMemo(() => data ?? [], [data]);
	const updateNoteMutation = useUpdateNote(projectId);
	const createInlineNoteMutation = useCreateInlineNote(projectId);
	const deleteNoteMutation = useDeleteNote(projectId);
	const { screenToFlowPosition } = useReactFlow();

	const [nodes, setNodes] = React.useState<Node[]>([]);
	const [draft, setDraft] = React.useState<DraftNote | null>(null);

	// `useMutation` results are not referentially stable across renders, so
	// route the delete call through a ref to keep `handleDeleteNote`'s
	// identity permanently stable. Otherwise the notes-sync effect below
	// (which depends on it) would re-run every render and loop forever.
	const deleteNoteMutationRef = React.useRef(deleteNoteMutation);
	deleteNoteMutationRef.current = deleteNoteMutation;
	const handleDeleteNote = React.useCallback(
		(id: number) => {
			deleteNoteMutationRef.current.mutate(id);
			if (selectedNoteId === id) {
				onSelectNote(null);
			}
		},
		[selectedNoteId, onSelectNote],
	);

	// Keep React Flow nodes in sync with the notes fetched from the API,
	// preserving in-flight drag positions by only replacing note-derived
	// nodes (the inline draft node, if any, is managed separately).
	React.useEffect(() => {
		setNodes((current) => {
			const currentById = new Map(current.map((n) => [n.id, n]));
			return notes.map((note, index) => {
				const id = String(note.id);
				const existing = currentById.get(id);
				const fallback = gridPosition(index);
				const position =
					note.canvasX !== null &&
					note.canvasX !== undefined &&
					note.canvasY !== null &&
					note.canvasY !== undefined
						? { x: note.canvasX, y: note.canvasY }
						: (existing?.position ?? fallback);

				const nodeData: NoteNodeData = { note, onDelete: handleDeleteNote };

				return {
					id,
					type: "noteNode",
					position,
					data: nodeData,
					selected: selectedNoteId === note.id,
					deletable: false,
				};
			});
		});
	}, [notes, handleDeleteNote, selectedNoteId]);

	/** Solid edges from the explicit `parentId` hierarchy — draggable/connectable to (re)parent notes. */
	const hierarchyEdges: Edge[] = React.useMemo(() => {
		const idsPresent = new Set(notes.map((n) => n.id));
		return notes
			.filter(
				(note) =>
					note.parentId !== null &&
					note.parentId !== undefined &&
					idsPresent.has(note.parentId),
			)
			.map((note) => ({
				id: `hierarchy-${note.parentId}-${note.id}`,
				source: String(note.parentId),
				target: String(note.id),
				animated: true,
				style: { stroke: "var(--palm)", strokeWidth: 1.5 },
				data: { edgeKind: "hierarchy" },
			}));
	}, [notes]);

	/**
	 * Dashed, read-only edges derived from `[[NOTE_ID]]` references found in
	 * note content — in addition to the explicit parent/child hierarchy.
	 * These aren't produced by user interaction on the canvas (no connect
	 * handles drive them), so they're excluded from `onConnect`/
	 * `onEdgesDelete` handling.
	 */
	const referenceEdges: Edge[] = React.useMemo(() => {
		const idsPresent = new Set(notes.map((n) => n.id));
		const edges: Edge[] = [];
		for (const note of notes) {
			const referencedIds = extractNoteReferenceIds(note.content);
			for (const referencedId of referencedIds) {
				if (referencedId === note.id || !idsPresent.has(referencedId)) {
					continue;
				}
				edges.push({
					id: `reference-${note.id}-${referencedId}`,
					source: String(note.id),
					target: String(referencedId),
					animated: false,
					selectable: false,
					reconnectable: false,
					style: {
						stroke: "var(--reference-link)",
						strokeWidth: 1.5,
						strokeDasharray: "4 4",
					},
					data: { edgeKind: "reference" },
				});
			}
		}
		return edges;
	}, [notes]);

	const edges = React.useMemo(
		() => [...hierarchyEdges, ...referenceEdges],
		[hierarchyEdges, referenceEdges],
	);

	const onNodesChange = React.useCallback((changes: NodeChange[]) => {
		setNodes((nds) => applyNodeChanges(changes, nds));
	}, []);

	const onNodeDragStop = React.useCallback(
		(_event: unknown, node: Node) => {
			if (node.type !== "noteNode") return;
			const id = Number(node.id);
			updateNoteMutation.mutate({
				id,
				payload: { canvasX: node.position.x, canvasY: node.position.y },
			});
		},
		[updateNoteMutation],
	);

	const onNodeClick = React.useCallback(
		(_event: unknown, node: Node) => {
			if (node.type !== "noteNode") return;
			const id = Number(node.id);
			onSelectNote(selectedNoteId === id ? null : id);
		},
		[selectedNoteId, onSelectNote],
	);

	const onConnect = React.useCallback(
		(connection: Connection) => {
			if (!connection.source || !connection.target) return;
			if (connection.source === connection.target) return;
			const targetId = Number(connection.target);
			const sourceId = Number(connection.source);
			updateNoteMutation.mutate({
				id: targetId,
				payload: { parentId: sourceId },
			});
		},
		[updateNoteMutation],
	);

	const onEdgesDelete = React.useCallback(
		(deleted: Edge[]) => {
			for (const edge of deleted) {
				if (edge.data?.edgeKind !== "hierarchy") continue;
				const targetId = Number(edge.target);
				updateNoteMutation.mutate({
					id: targetId,
					payload: { parentId: null },
				});
			}
		},
		[updateNoteMutation],
	);

	const handleCreateDraftAt = React.useCallback((x: number, y: number) => {
		setDraft({ id: `draft-${Date.now()}`, x, y });
	}, []);

	const onPaneDoubleClick = React.useCallback(
		(event: React.MouseEvent) => {
			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});
			handleCreateDraftAt(position.x, position.y);
		},
		[screenToFlowPosition, handleCreateDraftAt],
	);

	const onPaneClick = React.useCallback(() => {
		onSelectNote(null);
	}, [onSelectNote]);

	const handleAddNoteButton = React.useCallback(() => {
		const position = screenToFlowPosition({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		});
		handleCreateDraftAt(position.x, position.y);
	}, [screenToFlowPosition, handleCreateDraftAt]);

	const handleSaveDraft = React.useCallback(
		(payload: { type: NoteType; content: string }) => {
			if (!draft) return;
			createInlineNoteMutation.mutate(
				{
					type: payload.type,
					content: payload.content,
					canvasX: draft.x,
					canvasY: draft.y,
				},
				{
					onSuccess: () => setDraft(null),
				},
			);
		},
		[draft, createInlineNoteMutation],
	);

	const handleCancelDraft = React.useCallback(() => setDraft(null), []);

	const renderedNodes: Node[] = React.useMemo(() => {
		if (!draft) return nodes;
		return [
			...nodes,
			{
				id: draft.id,
				type: "inlineNoteDraft",
				position: { x: draft.x, y: draft.y },
				// Explicit width/height mark the node as already "measured", so
				// React Flow renders it immediately instead of keeping it
				// `visibility: hidden` until a ResizeObserver reports its size
				// (which never happens here since this node lives outside the
				// `nodes` state that `onNodesChange` reconciles dimension
				// changes into).
				width: 256,
				height: 160,
				data: {
					pending: createInlineNoteMutation.isPending,
					onSave: handleSaveDraft,
					onCancel: handleCancelDraft,
				},
				draggable: false,
				deletable: false,
			},
		];
	}, [
		nodes,
		draft,
		createInlineNoteMutation.isPending,
		handleSaveDraft,
		handleCancelDraft,
	]);

	return (
		<div className="flex flex-col h-full w-full min-h-0 bg-background">
			<div className="flex items-center justify-between gap-3 p-3 border-b border-line bg-surface-strong/95 backdrop-blur-md shrink-0">
				<div>
					<h1 className="text-lg font-bold text-sea-ink">Canvas</h1>
					<p className="text-xs text-muted-foreground">
						Drag notes to arrange them, connect nodes to link notes, and
						double-click an empty area to add a note inline.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon-xs"
						onClick={() => refetch()}
						title="Refresh notes"
					>
						<RefreshCw className="h-3 w-3" />
					</Button>
					<Button variant="outline" size="sm" onClick={handleAddNoteButton}>
						<PlusCircle className="h-4 w-4" />
						<span>Add Note</span>
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 relative">
				{isLoading ? (
					<div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground font-mono">
						Loading notes...
					</div>
				) : (
					// biome-ignore lint/a11y/noStaticElementInteractions: react-flow pane handles its own interaction model
					<div
						className="h-full w-full"
						onDoubleClick={(e) => {
							const target = e.target as HTMLElement;
							if (target.closest(".react-flow__node")) return;
							onPaneDoubleClick(e);
						}}
					>
						<ReactFlow
							nodes={renderedNodes}
							edges={edges}
							nodeTypes={nodeTypes}
							onNodesChange={onNodesChange}
							onNodeDragStop={onNodeDragStop}
							onNodeClick={onNodeClick}
							onPaneClick={onPaneClick}
							onConnect={onConnect}
							onEdgesDelete={onEdgesDelete}
							zoomOnDoubleClick={false}
							fitView
							colorMode={resolvedMode}
							proOptions={{ hideAttribution: true }}
						>
							<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
							<Controls />
							<MiniMap pannable zoomable />
						</ReactFlow>
					</div>
				)}
			</div>
		</div>
	);
}

export function CanvasViewContent(props: CanvasViewContentProps) {
	return (
		<ReactFlowProvider>
			<CanvasInnerView {...props} />
		</ReactFlowProvider>
	);
}

export default CanvasViewContent;
