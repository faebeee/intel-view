import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import type { JSX } from "react";
import { MapPin, RefreshCw, FileText, Edit2, Eye } from "lucide-react";
import type {
	LegacyColumnDef as ColumnDef,
	LegacyColumn as Column,
	LegacyRow as Row,
} from "@tanstack/react-table/legacy";
import type { Note } from "@repo/sdk";

import { DataTable, SortableHeader } from "#/components/ui/data-table.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { Button } from "#/components/ui/button.tsx";
import { EditNoteModal } from "#/features/notes/components/EditNoteModal.tsx";
import { ViewNoteModal } from "#/features/notes/components/ViewNoteModal.tsx";

export const Route = createFileRoute("/notes")({
	component: NotesRouteComponent,
});

function NotesRouteComponent(): JSX.Element {
	const {
		data: notes = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllNotesQuery();
	const [editingNote, setEditingNote] = React.useState<Note | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
	const [isViewOpen, setIsViewOpen] = React.useState(false);

	const handleEditClick = (note: Note) => {
		setEditingNote(note);
		setIsEditOpen(true);
	};

	const handleViewClick = (note: Note) => {
		setViewingNote(note);
		setIsViewOpen(true);
	};

	const columns: ColumnDef<Note, unknown>[] = [
		{
			accessorKey: "id",
			header: ({ column }: { column: Column<Note, unknown> }) => (
				<SortableHeader column={column} title="ID" />
			),
			cell: ({ row }: { row: Row<Note> }) => (
				<span className="font-mono text-palm font-bold">
					#{row.original.id}
				</span>
			),
		},
		{
			accessorKey: "content",
			header: ({ column }: { column: Column<Note, unknown> }) => (
				<SortableHeader column={column} title="CONTENT" />
			),
			cell: ({ row }: { row: Row<Note> }) => {
				const content = row.original.content || "";
				// Truncate if very long
				const truncated =
					content.length > 80 ? `${content.substring(0, 80)}...` : content;
				return (
					<button
						type="button"
						onClick={() => handleViewClick(row.original)}
						className="text-left whitespace-pre-wrap break-all hover:text-palm cursor-pointer transition-colors outline-none focus-visible:text-palm font-sans"
						title="Click to view full markdown intel"
					>
						{truncated}
					</button>
				);
			},
		},
		{
			accessorKey: "lat",
			header: ({ column }: { column: Column<Note, unknown> }) => (
				<SortableHeader column={column} title="LATITUDE" />
			),
			cell: ({ row }: { row: Row<Note> }) => {
				const lat = row.original.lat;
				return lat !== null && lat !== undefined ? (
					<span className="font-mono text-xs">{lat.toFixed(6)}</span>
				) : (
					<span className="text-muted-foreground font-mono">-</span>
				);
			},
		},
		{
			accessorKey: "lng",
			header: ({ column }: { column: Column<Note, unknown> }) => (
				<SortableHeader column={column} title="LONGITUDE" />
			),
			cell: ({ row }: { row: Row<Note> }) => {
				const lng = row.original.lng;
				return lng !== null && lng !== undefined ? (
					<span className="font-mono text-xs">{lng.toFixed(6)}</span>
				) : (
					<span className="text-muted-foreground font-mono">-</span>
				);
			},
		},
		{
			accessorKey: "createdAt",
			header: ({ column }: { column: Column<Note, unknown> }) => (
				<SortableHeader column={column} title="CREATED" />
			),
			cell: ({ row }: { row: Row<Note> }) => {
				const date = new Date(row.original.createdAt);
				return (
					<span className="font-mono text-xs whitespace-nowrap">
						{date.toLocaleDateString()}{" "}
						{date.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				);
			},
		},
		{
			id: "actions",
			header: () => (
				<span className="font-mono text-xs font-bold tracking-wider text-sea-ink/80 px-2">
					ACTIONS
				</span>
			),
			cell: ({ row }: { row: Row<Note> }) => {
				const note = row.original;
				const hasCoords =
					note.lat !== null &&
					note.lat !== undefined &&
					note.lng !== null &&
					note.lng !== undefined;
				return (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="xs"
							onClick={() => handleViewClick(note)}
							className="inline-flex items-center gap-1 border-line hover:bg-accent/25 hover:text-palm text-sea-ink font-mono text-xs"
							title="View rendered Markdown details"
						>
							<Eye className="h-3 w-3" />
							<span>View</span>
						</Button>

						<Button
							variant="outline"
							size="xs"
							onClick={() => handleEditClick(note)}
							className="inline-flex items-center gap-1 border-line hover:bg-accent/25 hover:text-palm text-sea-ink font-mono text-xs"
						>
							<Edit2 className="h-3 w-3" />
							<span>Edit</span>
						</Button>

						{hasCoords ? (
							<Link
								to="/map"
								className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-palm/10 border border-palm/20 hover:bg-palm/25 text-palm text-xs font-mono font-bold uppercase tracking-wider transition-colors no-underline"
							>
								<MapPin className="h-3 w-3" />
								<span>Locate</span>
							</Link>
						) : (
							<span className="text-muted-foreground font-mono text-xs italic px-2">
								No coords
							</span>
						)}
					</div>
				);
			},
		},
	];

	// Cast Notes to Record<string, unknown>[] to satisfy strict DataTable constraint
	const tableData = notes as unknown as Record<string, unknown>[];

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-palm" />
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							Notes Intelligence Database
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Secure terminal displaying searchable, sortable, and geolocated
						sector notes with full markdown capabilities.
					</p>
				</div>
				<div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="font-mono text-xs border-line hover:bg-accent/15 hover:text-palm text-sea-ink gap-1.5"
					>
						<RefreshCw
							className={`h-3 w-3 ${isLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-xs text-[#00f2ff]">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>DOWNLOADING NOTES ARCHIVE...</span>
					</div>
				</div>
			) : (
				<div className="flex-1">
					<DataTable
						columns={
							columns as unknown as ColumnDef<
								Record<string, unknown>,
								unknown
							>[]
						}
						data={tableData}
						searchPlaceholder="Search intel records by content..."
					/>
				</div>
			)}

			{/* View Note Modal */}
			<ViewNoteModal
				note={viewingNote}
				open={isViewOpen}
				onOpenChange={setIsViewOpen}
				onEditClick={handleEditClick}
			/>

			{/* Edit Note Modal */}
			<EditNoteModal
				note={editingNote}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</div>
	);
}
