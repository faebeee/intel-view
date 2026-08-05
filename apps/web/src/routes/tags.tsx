import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import type { JSX } from "react";
import { Tag as TagIcon, RefreshCw, Plus, Edit2, Trash2 } from "lucide-react";
import type {
	LegacyColumnDef as ColumnDef,
	LegacyColumn as Column,
	LegacyRow as Row,
} from "@tanstack/react-table/legacy";
import { tagControllerRemove } from "@repo/sdk";
import type { Tag } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DataTable, SortableHeader } from "#/components/ui/data-table.tsx";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { Button } from "#/components/ui/button.tsx";
import { CreateTagModal } from "#/features/tags/components/CreateTagModal.tsx";
import { EditTagModal } from "#/features/tags/components/EditTagModal.tsx";

export const Route = createFileRoute("/tags")({
	component: TagsRouteComponent,
});

function TagsRouteComponent(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: tags = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllTagsQuery();

	const [editingTag, setEditingTag] = React.useState<Tag | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);

	const handleEditClick = (tag: Tag) => {
		setEditingTag(tag);
		setIsEditOpen(true);
	};

	const removeTagMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await tagControllerRemove({
				path: { id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Tag deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["tags", "all"] });
		},
		onError: (err) => {
			console.error("Failed to delete tag:", err);
			toast.error("Failed to delete tag", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleDeleteClick = (tag: Tag) => {
		if (
			window.confirm(
				`Are you sure you want to permanently delete tag "${tag.name}"?`,
			)
		) {
			removeTagMutation.mutate(tag.id);
		}
	};

	const columns: ColumnDef<Tag, unknown>[] = [
		{
			accessorKey: "id",
			header: ({ column }: { column: Column<Tag, unknown> }) => (
				<SortableHeader column={column} title="ID" />
			),
			cell: ({ row }: { row: Row<Tag> }) => (
				<span className="font-mono text-palm font-bold">
					#{row.original.id}
				</span>
			),
		},
		{
			accessorKey: "name",
			header: ({ column }: { column: Column<Tag, unknown> }) => (
				<SortableHeader column={column} title="TAG" />
			),
			cell: ({ row }: { row: Row<Tag> }) => {
				const tag = row.original;
				const displayColor = tag.color || "#00f2ff";
				return (
					<span
						className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase border transition-all duration-200"
						style={{
							backgroundColor: `${displayColor}12`,
							borderColor: `${displayColor}40`,
							color: displayColor,
							boxShadow: `0 0 8px ${displayColor}10`,
						}}
					>
						{tag.name}
					</span>
				);
			},
		},
		{
			accessorKey: "color",
			header: ({ column }: { column: Column<Tag, unknown> }) => (
				<SortableHeader column={column} title="COLOR" />
			),
			cell: ({ row }: { row: Row<Tag> }) => (
				<span className="font-mono text-xs text-muted-foreground uppercase">
					{row.original.color || "-"}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			header: ({ column }: { column: Column<Tag, unknown> }) => (
				<SortableHeader column={column} title="CREATED" />
			),
			cell: ({ row }: { row: Row<Tag> }) => {
				const date = new Date(row.original.createdAt);
				return (
					<span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
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
			cell: ({ row }: { row: Row<Tag> }) => {
				const tag = row.original;
				return (
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="xs"
							onClick={() => handleEditClick(tag)}
							className="inline-flex items-center gap-1 border-line hover:bg-accent/25 hover:text-palm text-sea-ink font-mono text-xs"
						>
							<Edit2 className="h-3 w-3" />
							<span>Edit</span>
						</Button>

						<Button
							variant="outline"
							size="xs"
							onClick={() => handleDeleteClick(tag)}
							className="inline-flex items-center gap-1 border-destructive/30 hover:bg-destructive/20 hover:text-destructive text-destructive font-mono text-xs"
							disabled={removeTagMutation.isPending}
						>
							<Trash2 className="h-3 w-3" />
							<span>Delete</span>
						</Button>
					</div>
				);
			},
		},
	];

	// Cast Tags to Record<string, unknown>[] to satisfy strict DataTable constraint
	const tableData = tags as unknown as Record<string, unknown>[];

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			{/* Header Section */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2">
						<TagIcon className="h-5 w-5 text-palm" />
						<h1 className="text-xl font-bold text-sea-ink uppercase tracking-wider">
							Tags
						</h1>
					</div>
					<p className="text-xs text-muted-foreground">
						Manage categorical tags to organize notes.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isLoading || isRefetching}
						className="font-mono text-xs border-line hover:bg-accent/15 hover:text-palm text-sea-ink gap-1.5 h-9"
					>
						<RefreshCw
							className={`h-3 w-3 ${isLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>

					<Button
						onClick={() => setIsCreateOpen(true)}
						size="sm"
						className="bg-palm text-background border-none hover:bg-palm/90 shadow-[0_0_10px_rgba(56,189,248,0.4)] font-mono font-bold text-xs h-9 gap-1.5"
					>
						<Plus className="h-4 w-4" />
						<span>Add Tag</span>
					</Button>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<div className="flex-1 flex flex-col items-center justify-center py-20 font-mono text-xs text-[#00f2ff]">
					<div className="animate-pulse flex flex-col items-center gap-2">
						<span>Loading tags...</span>
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
						searchPlaceholder="Search tags by name..."
					/>
				</div>
			)}

			{/* Create Tag Modal */}
			<CreateTagModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Tag Modal */}
			<EditTagModal
				tag={editingTag}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</div>
	);
}
