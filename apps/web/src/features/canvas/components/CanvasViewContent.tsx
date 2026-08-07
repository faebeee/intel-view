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
import { useTheme } from "#/components/theme-provider";
import { Button } from "#/components/ui/button.tsx";
import { NoteDetailPanel } from "#/features/notes/components/NoteDetailPanel.tsx";
import type { NoteType } from "#/features/notes/noteTypes.ts";
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

function CanvasInnerView({ projectId }: { projectId: number }) {
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
	const [selectedNoteId, setSelectedNoteId] = React.useState<number | null>(
		null,
	);

	// `useMutation` results are not referentially stable across renders, so
	// route the delete call through a ref to keep `handleDeleteNote`'s
	// identity permanently stable. Otherwise the notes-sync effect below
	// (which depends on it) would re-run every render and loop forever.
	const deleteNoteMutationRef = React.useRef(deleteNoteMutation);
	deleteNoteMutationRef.current = deleteNoteMutation;
	const handleDeleteNote = React.useCallback((id: number) => {
		deleteNoteMutationRef.current.mutate(id);
	}, []);

	const handleViewNote = React.useCallback((id: number) => {
		setSelectedNoteId(id);
	}, []);

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

				const data: NoteNodeData = {
					note,
					onDelete: handleDeleteNote,
					onView: handleViewNote,
				};

				return {
					id,
					type: "noteNode",
					position,
					data,
					deletable: false,
				};
			});
		});
	}, [notes, handleDeleteNote, handleViewNote]);

	const edges: Edge[] = React.useMemo(() => {
		const idsPresent = new Set(notes.map((n) => n.id));
		return notes
			.filter(
				(note) =>
					note.parentId !== null &&
					note.parentId !== undefined &&
					idsPresent.has(note.parentId),
			)
			.map((note) => ({
				id: `e-${note.parentId}-${note.id}`,
				source: String(note.parentId),
				target: String(note.id),
				animated: true,
				style: { stroke: "var(--lagoon)", strokeWidth: 1.5 },
			}));
	}, [notes]);

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

			<div className="flex-1 min-h-0 flex flex-row divide-x divide-line">
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
								onConnect={onConnect}
								onEdgesDelete={onEdgesDelete}
								zoomOnDoubleClick={false}
								fitView
								colorMode={resolvedMode}
								proOptions={{ hideAttribution: true }}
							>
								<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
								<Controls />
								<MiniMap pannable zoomable className="!bg-surface-strong" />
							</ReactFlow>
						</div>
					)}
				</div>

				{/* Right Sidebar: Note Detail Panel (squeezes the canvas instead of
				 * overlaying it, and lets the user view full note details without
				 * leaving the canvas). */}
				<NoteDetailPanel
					projectId={projectId}
					noteId={selectedNoteId}
					onClose={() => setSelectedNoteId(null)}
				/>
			</div>
		</div>
	);
}

export function CanvasViewContent({ projectId }: { projectId: number }) {
	return (
		<ReactFlowProvider>
			<CanvasInnerView projectId={projectId} />
		</ReactFlowProvider>
	);
}

export default CanvasViewContent;
