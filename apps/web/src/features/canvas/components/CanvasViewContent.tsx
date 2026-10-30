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
import { CreateNoteModal } from "#/features/notes/components/CreateNoteModal.tsx";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import {
	useAddNoteParent,
	useRemoveNoteParent,
} from "#/features/notes/hooks/useNoteRelationMutations.ts";
import type { NoteType } from "#/types/note.ts";
import { useCanvasNotesQuery } from "../hooks/useCanvasNotesQuery";
import { useCreateInlineNote } from "../hooks/useCreateInlineNote";
import { useUpdateNote } from "../hooks/useUpdateNote";
import {
	CANVAS_GRID_CELL_HEIGHT,
	CANVAS_GRID_CELL_WIDTH,
	CANVAS_GRID_COLUMNS,
	type NoteNodeData,
} from "../types";
import { NoteNode } from "./NoteNode";

const nodeTypes = {
	noteNode: NoteNode,
};

type DraftNote = {
	x: number;
	y: number;
};

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
	/** Called with a note's id when its card is double-clicked, so the caller can open an in-place editor (e.g. a modal) for that note. */
	onNoteDoubleClick?: (noteId: number) => void;
	/** Called with a newly created note's id right after it's created on the canvas, so the caller can immediately open an in-place editor (e.g. a modal) for it. */
	onNoteCreated?: (noteId: number) => void;
	/**
	 * Monotonically increasing counter bumped by the caller to request that
	 * the viewport pan to `selectedNoteId`. Used when a note is selected from
	 * outside the canvas (e.g. the notes sidebar), where the node may be far
	 * off-screen; canvas-internal clicks deliberately don't bump it, so
	 * clicking a visible node never yanks the viewport around.
	 */
	revealRequest?: number;
};

function CanvasInnerView({
	projectId,
	selectedNoteId,
	onSelectNote,
	onNoteDoubleClick,
	onNoteCreated,
	revealRequest = 0,
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
	const addNoteParentMutation = useAddNoteParent(projectId);
	const removeNoteParentMutation = useRemoveNoteParent(projectId);
	const { screenToFlowPosition, setCenter, getNode, getZoom } = useReactFlow();

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

	// Pan the viewport to the selected note when the caller bumps
	// `revealRequest`. Guarded by a ref so this only fires on an actual
	// reveal request, never on unrelated re-renders or selection changes
	// originating from a click on the canvas itself.
	const lastRevealRef = React.useRef(revealRequest);
	React.useEffect(() => {
		if (revealRequest === lastRevealRef.current) return;
		lastRevealRef.current = revealRequest;
		if (selectedNoteId === null) return;
		const node = getNode(String(selectedNoteId));
		if (!node) return;
		const width = node.measured?.width ?? 240;
		const height = node.measured?.height ?? 120;
		setCenter(node.position.x + width / 2, node.position.y + height / 2, {
			zoom: getZoom(),
			duration: 400,
		});
	}, [revealRequest, selectedNoteId, getNode, setCenter, getZoom]);

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

	/** Solid edges from each note's `childIds` — draggable/connectable to add or remove parent/child relations. A note may have multiple parents/children, so multiple edges per note are expected. */
	const hierarchyEdges: Edge[] = React.useMemo(() => {
		const idsPresent = new Set(notes.map((n) => n.id));
		const edges: Edge[] = [];
		for (const note of notes) {
			for (const childId of note.childIds ?? []) {
				if (!idsPresent.has(childId)) continue;
				edges.push({
					id: `hierarchy-${note.id}-${childId}`,
					source: String(note.id),
					target: String(childId),
					animated: true,
					style: { stroke: "var(--palm)", strokeWidth: 1.5 },
					data: { edgeKind: "hierarchy" },
				});
			}
		}
		return edges;
	}, [notes]);

	/**
	 * Edges shown on the canvas. Only the explicit parent/child hierarchy is
	 * shown — `[[NOTE_ID]]` content references no longer produce edges here
	 * (they're resolved/embedded inline in rendered note content instead).
	 */
	const edges: Edge[] = hierarchyEdges;

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

	const onNodeDoubleClick = React.useCallback(
		(_event: unknown, node: Node) => {
			if (node.type !== "noteNode") return;
			const id = Number(node.id);
			onSelectNote(id);
			onNoteDoubleClick?.(id);
		},
		[onSelectNote, onNoteDoubleClick],
	);

	const onConnect = React.useCallback(
		(connection: Connection) => {
			if (!connection.source || !connection.target) return;
			if (connection.source === connection.target) return;
			const parentId = Number(connection.source);
			const childId = Number(connection.target);
			addNoteParentMutation.mutate({ id: childId, parentId });
		},
		[addNoteParentMutation],
	);

	const onEdgesDelete = React.useCallback(
		(deleted: Edge[]) => {
			for (const edge of deleted) {
				if (edge.data?.edgeKind !== "hierarchy") continue;
				const parentId = Number(edge.source);
				const childId = Number(edge.target);
				removeNoteParentMutation.mutate({ id: childId, parentId });
			}
		},
		[removeNoteParentMutation],
	);

	const handleCreateDraftAt = React.useCallback((x: number, y: number) => {
		setDraft({ x, y });
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

	const handleCreateNote = React.useCallback(
		(type: NoteType) => {
			if (!draft) return;
			createInlineNoteMutation.mutate(
				{
					type,
					canvasX: draft.x,
					canvasY: draft.y,
				},
				{
					onSuccess: (note) => {
						setDraft(null);
						onSelectNote(note.id);
						onNoteCreated?.(note.id);
					},
				},
			);
		},
		[draft, createInlineNoteMutation, onSelectNote, onNoteCreated],
	);

	return (
		<div className="flex flex-col h-full w-full min-h-0 bg-background">
			<div className="flex items-center justify-between gap-3 p-3 border-b border-line bg-surface-strong/95 backdrop-blur-md shrink-0">
				<div>
					<h1 className="text-lg font-bold text-sea-ink">Canvas</h1>
					<p className="text-xs text-muted-foreground">
						Drag notes to arrange them, connect nodes to link notes, and
						double-click an empty area to add a note.
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
							nodes={nodes}
							edges={edges}
							nodeTypes={nodeTypes}
							onNodesChange={onNodesChange}
							onNodeDragStop={onNodeDragStop}
							onNodeClick={onNodeClick}
							onNodeDoubleClick={onNodeDoubleClick}
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

			<CreateNoteModal
				open={draft !== null}
				onOpenChange={(open) => {
					if (!open) setDraft(null);
				}}
				onCreate={handleCreateNote}
				isCreating={createInlineNoteMutation.isPending}
			/>
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
