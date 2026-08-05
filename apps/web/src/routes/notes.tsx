import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import type { JSX } from "react";
import {
	createColumnHelper,
	tableFeatures,
	useTable,
	rowSortingFeature,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	ArrowUp,
	ArrowDown,
	Plus,
	Search,
	Loader2,
	Pencil,
	Trash2,
	MapPin,
	StickyNote,
} from "lucide-react";
import {
	noteControllerFindAll,
	noteControllerCreate,
	noteControllerUpdate,
	noteControllerRemove,
} from "@repo/sdk";
import type { PaginatedResponse, Note } from "../types/note";
import { Pagination } from "../components/nodes/Pagination";
import { NoteForm } from "../components/nodes/NoteForm";
import { DeleteConfirm } from "../components/nodes/DeleteConfirm";

export const Route = createFileRoute("/notes")({
	component: NotesPage,
});

// Create table features static configuration outside component render
const features = tableFeatures({
	rowSortingFeature,
});

const EMPTY_DATA: Note[] = [];

function NotesPage(): JSX.Element {
	const queryClient = useQueryClient();

	// Search & pagination state
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [page, setPage] = useState(1);
	const [limit] = useState(10);

	// Sorting state
	const [sorting, setSorting] = useState<{ id: string; desc: boolean }[]>([]);

	// Form & modal states
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingNote, setEditingNote] = useState<Note | null>(null);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

	// Debounce search input
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(search);
			setPage(1); // Reset to page 1 on new search
		}, 300);
		return () => clearTimeout(handler);
	}, [search]);

	// Map TanStack sorting state to NestJS/nestjs-paginate API format
	const sortByQuery = useMemo(() => {
		if (sorting.length === 0) {
			return ["createdAt:DESC"];
		}
		// Convert to exact expected string formats
		return sorting.map((s) => {
			const dir = s.desc ? "DESC" : "ASC";
			return `${s.id}:${dir}`;
		});
	}, [sorting]);

	// Fetch Notes Query
	const {
		data: notesData,
		isLoading,
		isError,
		error,
	} = useQuery<PaginatedResponse<Note>>({
		queryKey: ["notes", page, limit, debouncedSearch, sortByQuery],
		queryFn: async () => {
			// SortBy requires specific type mapping or casting to match openapi-ts types
			const response = await noteControllerFindAll({
				query: {
					page,
					limit,
					search: debouncedSearch || undefined,
					sortBy: sortByQuery as Array<
						| "id:ASC"
						| "id:DESC"
						| "createdAt:ASC"
						| "createdAt:DESC"
						| "updatedAt:ASC"
						| "updatedAt:DESC"
					>,
				},
			});
			return response.data as PaginatedResponse<Note>;
		},
	});

	// Create Note Mutation
	const createMutation = useMutation({
		mutationFn: async (data: { content: string; lat: number | null; lng: number | null }) => {
			const response = await noteControllerCreate({
				body: data,
			});
			return response.data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["notes"] });
			setIsFormOpen(false);
		},
	});

	// Update Note Mutation
	const updateMutation = useMutation({
		mutationFn: async ({ id, data }: { id: number; data: { content: string; lat: number | null; lng: number | null } }) => {
			const response = await noteControllerUpdate({
				path: { id },
				body: data,
			});
			return response.data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["notes"] });
			setIsFormOpen(false);
			setEditingNote(null);
		},
	});

	// Delete Note Mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: number) => {
			const response = await noteControllerRemove({
				path: { id },
			});
			return response.data;
		},
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["notes"] });
			setIsDeleteConfirmOpen(false);
			setDeletingNoteId(null);
		},
	});

	// Table Columns setup
	const helper = useMemo(() => createColumnHelper<typeof features, Note>(), []);

	const columns = useMemo(() => {
		return helper.columns([
			helper.accessor("id", {
				header: "ID",
				cell: (info) => (
					<span className="font-mono text-xs font-semibold text-sea-ink-soft">
						#{info.getValue()}
					</span>
				),
			}),
			helper.accessor("content", {
				header: "Content",
				cell: (info) => (
					<div className="max-w-md truncate text-sm text-sea-ink whitespace-pre-wrap break-words">
						{info.getValue()}
					</div>
				),
			}),
			helper.accessor("createdAt", {
				header: "Created At",
				cell: (info) => {
					const date = new Date(info.getValue());
					return (
						<span className="text-xs text-sea-ink-soft">
							{date.toLocaleDateString(undefined, {
								year: "numeric",
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</span>
					);
				},
			}),
			helper.accessor("lat", {
				header: "Location",
				cell: (info) => {
					const lat = info.row.original.lat;
					const lng = info.row.original.lng;
					if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
						return (
							<div className="flex items-center gap-1 bg-sea-ink/5 px-2.5 py-1 rounded w-fit text-xs text-sea-ink-soft border border-line">
								<MapPin className="w-3.5 h-3.5 text-lagoon" />
								<span>
									{lat.toFixed(4)}, {lng.toFixed(4)}
								</span>
							</div>
						);
					}
					return (
						<span className="italic text-xs text-sea-ink-soft/40">
							No location
						</span>
					);
				},
			}),
			helper.display({
				id: "actions",
				header: () => <span className="sr-only">Actions</span>,
				cell: (info) => (
					<div className="flex items-center justify-end gap-2">
						<button
							onClick={() => {
								setEditingNote(info.row.original);
								setIsFormOpen(true);
							}}
							className="p-1.5 rounded-md hover:bg-lagoon/15 text-sea-ink-soft hover:text-lagoon transition-colors"
							title="Edit note"
							type="button"
						>
							<Pencil className="w-4 h-4" />
						</button>
						<button
							onClick={() => {
								setDeletingNoteId(info.row.original.id);
								setIsDeleteConfirmOpen(true);
							}}
							className="p-1.5 rounded-md hover:bg-destructive/15 text-sea-ink-soft hover:text-destructive transition-colors"
							title="Delete note"
							type="button"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				),
			}),
		]);
	}, [helper]);

	// Instantiate useTable hook
	const table = useTable({
		features,
		columns,
		data: notesData?.data ?? EMPTY_DATA,
		state: {
			sorting,
		},
		onSortingChange: setSorting,
		manualSorting: true,
	});

	return (
		<div className="page-wrap py-10 px-4 md:px-0">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
				<div className="space-y-1">
					<div className="flex items-center gap-2 text-palm font-bold text-xs uppercase tracking-widest">
						<StickyNote className="w-4 h-4" />
						<span>Workspace</span>
					</div>
					<h1 className="text-3xl font-extrabold text-sea-ink tracking-tight display-title">
						Notes Database
					</h1>
					<p className="text-sm text-sea-ink-soft">
						Manage and visualize location-based context notes in a structured table.
					</p>
				</div>

				<button
					onClick={() => {
						setEditingNote(null);
						setIsFormOpen(true);
					}}
					className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-palm hover:bg-palm/90 text-white rounded-md shadow-md hover:shadow-lg hover:translate-y-[-1px] active:translate-y-0 transition-all cursor-pointer"
					type="button"
				>
					<Plus className="w-4 h-4" />
					<span>Add Location Note</span>
				</button>
			</div>

			{/* Filter & Controls */}
			<div className="island-shell p-4 rounded-lg border border-line bg-surface/50 mb-6 flex flex-col md:flex-row items-center gap-4">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sea-ink-soft/60" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search notes content..."
						className="w-full pl-9 pr-4 py-2 text-sm bg-chip-bg border border-line rounded-md focus:outline-none focus:border-lagoon focus:ring-1 focus:ring-lagoon transition-all text-sea-ink"
					/>
				</div>
				<div className="text-xs text-sea-ink-soft italic shrink-0">
					{isLoading ? (
						<div className="flex items-center gap-1.5">
							<Loader2 className="w-3.5 h-3.5 animate-spin text-palm" />
							<span>Fetching latest...</span>
						</div>
					) : (
						<span>Found {notesData?.meta?.totalItems ?? 0} notes total</span>
					)}
				</div>
			</div>

			{/* Table Container */}
			<div className="island-shell rounded-lg border border-line bg-surface-strong overflow-hidden shadow-lg">
				{isLoading && (notesData?.data ?? []).length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
						<Loader2 className="w-10 h-10 animate-spin text-palm" />
						<p className="text-sm text-sea-ink-soft font-medium">
							Loading notes database...
						</p>
					</div>
				) : isError ? (
					<div className="flex flex-col items-center justify-center py-16 text-center space-y-3 px-4">
						<div className="p-3 bg-destructive/10 text-destructive rounded-full">
							<Trash2 className="w-6 h-6" />
						</div>
						<h3 className="text-lg font-bold text-sea-ink">Failed to load notes</h3>
						<p className="text-sm text-sea-ink-soft max-w-md">
							{error?.message || "There was an issue communicating with the database server."}
						</p>
					</div>
				) : (notesData?.data ?? []).length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-4">
						<StickyNote className="w-12 h-12 text-sea-ink-soft/40" />
						<div className="space-y-1">
							<h3 className="text-lg font-bold text-sea-ink">No notes found</h3>
							<p className="text-sm text-sea-ink-soft max-w-sm">
								{search ? "No notes matched your search criteria. Try a different query." : "Start pinning location-based context notes to populate the database!"}
							</p>
						</div>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="px-4 py-2 text-xs font-semibold text-sea-ink border border-line bg-chip-bg rounded hover:bg-sea-ink/5 transition-all"
								type="button"
							>
								Clear Search
							</button>
						)}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-line">
							<thead>
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id} className="border-b border-line bg-surface/30">
										{headerGroup.headers.map((header) => {
											const isSortable = header.column.getCanSort();
											const sortingState = header.column.getIsSorted();

											return (
												<th
													key={header.id}
													className={`px-6 py-4 text-xs font-bold text-sea-ink-soft uppercase tracking-wider text-left ${
														isSortable ? "cursor-pointer select-none hover:bg-sea-ink/5 transition-all" : ""
													}`}
													onClick={header.column.getToggleSortingHandler()}
												>
													<div className="flex items-center gap-1.5">
														{header.isPlaceholder ? null : (
															<table.FlexRender header={header} />
														)}
														{isSortable && (
															<span>
																{sortingState === "asc" ? (
																	<ArrowUp className="w-3.5 h-3.5 text-palm" />
																) : sortingState === "desc" ? (
																	<ArrowDown className="w-3.5 h-3.5 text-palm" />
																) : (
																	<ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
																)}
															</span>
														)}
													</div>
												</th>
											);
										})}
									</tr>
								))}
							</thead>
							<tbody className="divide-y divide-line bg-transparent">
								{table.getRowModel().rows.map((row) => (
									<tr
										key={row.id}
										className="hover:bg-sea-ink/[0.02] transition-colors"
									>
										{row.getAllCells().map((cell) => (
											<td
												key={cell.id}
												className="px-6 py-4 align-middle"
											>
												<table.FlexRender cell={cell} />
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination Controls */}
			{notesData && (
				<Pagination
					currentPage={page}
					totalPages={notesData.meta.totalPages}
					onPageChange={setPage}
					totalItems={notesData.meta.totalItems}
					itemsPerPage={limit}
				/>
			)}

			{/* Form Modal (Create / Edit) */}
			{isFormOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
					<div className="island-shell w-full max-w-lg p-6 rounded-lg border border-line bg-surface-strong shadow-xl animate-scale-up">
						<h3 className="text-xl font-bold text-sea-ink display-title mb-4">
							{editingNote ? "Edit Location Note" : "Create New Note"}
						</h3>
						<NoteForm
							initialValues={editingNote}
							onSubmit={(data) => {
								if (editingNote) {
									updateMutation.mutate({ id: editingNote.id, data });
								} else {
									createMutation.mutate(data);
								}
							}}
							onCancel={() => {
								setIsFormOpen(false);
								setEditingNote(null);
							}}
							isSubmitting={createMutation.isPending || updateMutation.isPending}
						/>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteConfirm
				isOpen={isDeleteConfirmOpen}
				onConfirm={() => {
					if (deletingNoteId !== null) {
						deleteMutation.mutate(deletingNoteId);
					}
				}}
				onCancel={() => {
					setIsDeleteConfirmOpen(false);
					setDeletingNoteId(null);
				}}
				isDeleting={deleteMutation.isPending}
			/>
		</div>
	);
}
