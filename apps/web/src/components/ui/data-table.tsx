"use client";

import * as React from "react";
import {
	useLegacyTable as useTable,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import type {
	LegacyColumnDef as ColumnDef,
	LegacyColumn as Column,
} from "@tanstack/react-table/legacy";
import type { SortingState } from "@tanstack/react-table";
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./table";
import { Button } from "./button";
import { Input } from "./input";

type DataTableProps<TData extends Record<string, unknown>> = {
	columns: ColumnDef<TData, unknown>[];
	data: TData[];
	searchPlaceholder?: string;
};

export function DataTable<TData extends Record<string, unknown>>({
	columns,
	data,
	searchPlaceholder = "Search...",
}: DataTableProps<TData>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [globalFilter, setGlobalFilter] = React.useState<string>("");

	const table = useTable<TData>({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		state: {
			sorting,
			globalFilter,
		},
		initialState: {
			pagination: {
				pageIndex: 0,
				pageSize: 10,
			},
		},
	});

	return (
		<div className="flex flex-col gap-4 w-full">
			{/* Search Control */}
			<div className="flex items-center justify-between gap-4">
				<div className="relative w-full max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
					<Input
						placeholder={searchPlaceholder}
						value={globalFilter ?? ""}
						onChange={(event) => setGlobalFilter(event.target.value)}
						className="pl-9 bg-surface-strong/50 border-line text-sea-ink placeholder:text-muted-foreground focus-visible:ring-palm/50"
					/>
				</div>
				<div className="text-xs font-mono text-muted-foreground">
					Total: <span className="text-palm">{data.length}</span>
				</div>
			</div>

			{/* Table Container */}
			<div className="rounded-lg border border-line bg-surface-strong/30 backdrop-blur-md overflow-hidden">
				<Table>
					<TableHeader className="bg-surface-strong/65 border-b border-line">
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow
								key={headerGroup.id}
								className="border-b border-line/40 hover:bg-transparent"
							>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className="h-11 text-xs font-mono font-bold tracking-wider text-sea-ink/80 px-4"
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className="border-b border-line/20 hover:bg-accent/10 transition-colors"
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="px-4 py-3 text-sm text-sea-ink-soft"
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center text-muted-foreground font-mono text-xs"
								>
									No records found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination controls */}
			{table.getPageCount() > 1 && (
				<div className="flex items-center justify-between gap-4 py-1">
					<div className="text-xs font-mono text-muted-foreground">
						Page{" "}
						<span className="text-palm">
							{table.getState().pagination.pageIndex + 1}
						</span>{" "}
						of <span className="text-palm">{table.getPageCount()}</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
							className="font-mono text-xs border-line hover:bg-accent/25 hover:text-palm text-sea-ink disabled:opacity-30"
						>
							Prev
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
							className="font-mono text-xs border-line hover:bg-accent/25 hover:text-palm text-sea-ink disabled:opacity-30"
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

// Helper component for Sortable column headers
type SortableHeaderProps<TData extends Record<string, unknown>, TValue> = {
	column: Column<TData, TValue>;
	title: string;
};

export function SortableHeader<TData extends Record<string, unknown>, TValue>({
	column,
	title,
}: SortableHeaderProps<TData, TValue>) {
	const isSorted = column.getIsSorted();

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			className="-ml-3 h-8 gap-1 font-mono text-xs font-bold tracking-wider text-sea-ink/80 hover:bg-accent/15 hover:text-palm"
		>
			<span>{title}</span>
			{isSorted === "desc" ? (
				<ChevronDown className="h-3 w-3 text-palm" />
			) : isSorted === "asc" ? (
				<ChevronUp className="h-3 w-3 text-palm" />
			) : (
				<ChevronsUpDown className="h-3 w-3 opacity-50" />
			)}
		</Button>
	);
}
