import type { Connection, Edge, Node, NodeChange } from "@xyflow/react";
import {
	applyNodeChanges,
	Background,
	BackgroundVariant,
	ReactFlow,
	ReactFlowProvider,
	useReactFlow,
} from "@xyflow/react";
import * as React from "react";
import { useTheme } from "#/components/theme-provider.tsx";
import { LoadingState } from "#/components/ui/loading-state.tsx";
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
import { LinkEdge, type LinkEdgeData } from "./LinkEdge";
import { NoteNode } from "./NoteNode";
import { ZoomControls } from "./ZoomControls";

const nodeTypes = {
	noteNode: NoteNode,
};

const edgeTypes = {
	link: LinkEdge,
};

const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

function focusNode(id: number): void {
	document
		.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)
		?.focus();
}

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
	/** Counter bumped by the caller (e.g. the page header's "New note" button) to start a new note at the centre of the canvas. */
	addNoteRequest?: number;
};

function CanvasInnerView({
	projectId,
	selectedNoteId,
	onSelectNote,
	onNoteDoubleClick,
	onNoteCreated,
	revealRequest = 0,
	addNoteRequest = 0,
}: CanvasViewContentProps) {
	const { resolvedMode } = useTheme();
	const { data, isLoading } = useCanvasNotesQuery(projectId);
	const containerRef = React.useRef<HTMLDivElement>(null);
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

				const selected = selectedNoteId === note.id;
				return {
					id,
					type: "noteNode",
					position,
					data: nodeData,
					selected,
					deletable: false,
					ariaRole: "button",
					ariaLabel: `${note.type} note #${note.id}: ${note.title || "untitled"}`,
					domAttributes: { "aria-pressed": selected },
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
				const data: LinkEdgeData = {
					edgeKind: "hierarchy",
					active: selectedNoteId === note.id || selectedNoteId === childId,
				};
				edges.push({
					id: `hierarchy-${note.id}-${childId}`,
					type: "link",
					source: String(note.id),
					target: String(childId),
					data,
				});
			}
		}
		return edges;
	}, [notes, selectedNoteId]);

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
		const rect = containerRef.current?.getBoundingClientRect();
		const position = screenToFlowPosition({
			x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
			y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
		});
		handleCreateDraftAt(position.x, position.y);
	}, [screenToFlowPosition, handleCreateDraftAt]);

	// Start a new note when the caller bumps `addNoteRequest` (same
	// ref-guard pattern as `revealRequest` above).
	const lastAddNoteRef = React.useRef(addNoteRequest);
	React.useEffect(() => {
		if (addNoteRequest === lastAddNoteRef.current) return;
		lastAddNoteRef.current = addNoteRequest;
		handleAddNoteButton();
	}, [addNoteRequest, handleAddNoteButton]);

	/**
	 * Keyboard support on focused nodes (handoff §06): Enter/Space selects,
	 * arrows move focus along links — Up to a parent, Down to a child,
	 * Left/Right between siblings. Handled in the capture phase so React
	 * Flow's own arrow-key node nudging doesn't also move the node.
	 */
	const onKeyDownCapture = React.useCallback(
		(event: React.KeyboardEvent) => {
			const target = event.target as HTMLElement;
			if (!target.classList.contains("react-flow__node")) return;
			const id = Number(target.dataset.id);
			const note = notes.find((n) => n.id === id);
			if (!note) return;

			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				event.stopPropagation();
				onSelectNote(selectedNoteId === id ? null : id);
				return;
			}
			if (!ARROW_KEYS.has(event.key)) return;
			event.preventDefault();
			event.stopPropagation();

			let next: number | undefined;
			if (event.key === "ArrowUp") next = note.parentIds?.[0];
			else if (event.key === "ArrowDown") next = note.childIds?.[0];
			else {
				const parent = notes.find((n) => n.id === note.parentIds?.[0]);
				const siblings = parent?.childIds ?? [];
				const index = siblings.indexOf(id);
				const step = event.key === "ArrowRight" ? 1 : -1;
				next = index >= 0 ? siblings[index + step] : undefined;
			}
			if (next !== undefined) focusNode(next);
		},
		[notes, selectedNoteId, onSelectNote],
	);

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
		<div ref={containerRef} className="relative h-full w-full min-h-0 bg-mc-bg">
			{isLoading ? (
				<LoadingState label="Loading notes..." compact />
			) : (
				// biome-ignore lint/a11y/noStaticElementInteractions: react-flow pane handles its own interaction model; key handling only augments focused nodes
				<div
					className="h-full w-full"
					onKeyDownCapture={onKeyDownCapture}
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
						edgeTypes={edgeTypes}
						onNodesChange={onNodesChange}
						onNodeDragStop={onNodeDragStop}
						onNodeClick={onNodeClick}
						onNodeDoubleClick={onNodeDoubleClick}
						onPaneClick={onPaneClick}
						onConnect={onConnect}
						onEdgesDelete={onEdgesDelete}
						zoomOnDoubleClick={false}
						fitView
						fitViewOptions={{ maxZoom: 1 }}
						colorMode={resolvedMode}
						connectionLineStyle={{
							stroke: "var(--mc-accent)",
							strokeWidth: 2,
							strokeDasharray: "6 6",
						}}
						proOptions={{ hideAttribution: true }}
					>
						<Background
							variant={BackgroundVariant.Lines}
							gap={32}
							lineWidth={1}
							color="var(--mc-grid-line)"
							bgColor="var(--mc-bg)"
						/>
					</ReactFlow>
					<div className="pointer-events-none absolute right-6 bottom-5 left-6 flex flex-wrap items-center justify-end gap-3">
						<div className="pointer-events-auto">
							<ZoomControls />
						</div>
					</div>
				</div>
			)}

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
