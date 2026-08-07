import type { TagResponseDto as Tag } from "@repo/sdk";
import { tagControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type {
	LegacyColumn as Column,
	LegacyColumnDef as ColumnDef,
	LegacyRow as Row,
} from "@tanstack/react-table/legacy";
import { Edit2, Plus, RefreshCw, Tag as TagIcon, Trash2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { DataTable, SortableHeader } from "#/components/ui/data-table.tsx";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { TagChip } from "#/components/ui/tag-chip.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { TagModal } from "#/features/tags/components/TagModal.tsx";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

export const Route = createFileRoute("/projects/$projectId/tags")({
	component: TagsRouteComponent,
});

function TagsRouteComponent(): JSX.Element {
	const { projectId: projectIdParam } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);
	const queryClient = useQueryClient();
	const {
		data: tags = [],
		isLoading,
		isRefetching,
		refetch,
	} = useAllTagsQuery(projectId);

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
				path: { projectId, id },
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Tag deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["tags", "all", projectId] });
		},
		onError: toastApiError("delete tag"),
	});

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
				return (
					<TagChip tag={tag.name} color={tag.color || "#00f2ff"} size="sm" />
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
						>
							<Edit2 className="h-3 w-3" />
							<span>Edit</span>
						</Button>

						<ConfirmationButton
							variant="outline"
							size="xs"
							onClick={() => removeTagMutation.mutate(tag.id)}
							disabled={removeTagMutation.isPending}
							title="Delete Tag"
							description={`Are you sure you want to permanently delete tag "${tag.name}"?`}
							confirmText="Delete"
						>
							<Trash2 className="h-3 w-3" />
							<span>Delete</span>
						</ConfirmationButton>
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
					>
						<RefreshCw
							className={`h-3 w-3 ${isLoading || isRefetching ? "animate-spin" : ""}`}
						/>
						<span>
							{isLoading || isRefetching ? "REFRESHING..." : "REFRESH"}
						</span>
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="default"
						onClick={() => setIsCreateOpen(true)}
						size="sm"
					>
						<Plus className="h-4 w-4" />
						<span>Add Tag</span>
					</Button>
				</div>
			</div>

			{/* Main Content Area */}
			{isLoading && !isRefetching ? (
				<LoadingState label="Loading tags..." compact />
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
			<TagModal
				projectId={projectId}
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>

			{/* Edit Tag Modal */}
			<TagModal
				projectId={projectId}
				tag={editingTag}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</div>
	);
}
