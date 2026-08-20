import type { ProjectGroupResponseDto } from "@repo/sdk";
import { projectGroupControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, FolderPlus, Trash2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { useAllProjectGroupsQuery } from "#/features/project-groups/hooks/useAllProjectGroupsQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { ProjectGroupModal } from "./ProjectGroupModal";

type ManageProjectGroupsModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * Lists all project groups with inline edit/delete, plus an entry point for
 * creating new ones. Deleting a group unassigns (does not delete) any
 * projects that belonged to it.
 */
export function ManageProjectGroupsModal({
	open,
	onOpenChange,
}: ManageProjectGroupsModalProps): JSX.Element {
	const queryClient = useQueryClient();
	const { data: groups = [], isLoading } = useAllProjectGroupsQuery();

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingGroup, setEditingGroup] =
		React.useState<ProjectGroupResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const removeGroupMutation = useMutation({
		mutationFn: async (id: number) => {
			const res = await projectGroupControllerRemove({ path: { id } });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Group deleted. Its projects are now ungrouped.");
			queryClient.invalidateQueries({ queryKey: ["project-groups", "all"] });
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
		},
		onError: toastApiError("delete group"),
	});

	const handleEditClick = (group: ProjectGroupResponseDto) => {
		setEditingGroup(group);
		setIsEditOpen(true);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-lg shadow-2xl shadow-black/80">
					<DialogHeader className="space-y-1">
						<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
							Manage Groups
						</DialogTitle>
						<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
							Create, rename or delete project groups. Deleting a group only
							unassigns its projects — it does not delete them.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 my-2">
						<Button
							variant="default"
							size="sm"
							className="w-full"
							onClick={() => setIsCreateOpen(true)}
						>
							<FolderPlus className="h-4 w-4" />
							<span>New Group</span>
						</Button>

						{isLoading ? (
							<LoadingState label="Loading groups..." compact />
						) : groups.length === 0 ? (
							<p className="text-xs text-muted-foreground text-center py-6">
								No groups yet. Create one to start organizing projects.
							</p>
						) : (
							<ul className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
								{groups.map((group) => (
									<li
										key={group.id}
										className="flex items-center justify-between gap-2 rounded-md border border-line/60 bg-surface/60 px-3 py-2"
									>
										<div className="flex items-center gap-2 min-w-0">
											<span
												className="size-3 rounded-full shrink-0 border border-black/30"
												style={{ backgroundColor: group.color }}
											/>
											<span className="text-sm font-mono text-sea-ink truncate">
												{group.name}
											</span>
										</div>
										<div className="flex items-center gap-1.5 shrink-0">
											<Button
												variant="outline"
												size="xs"
												onClick={() => handleEditClick(group)}
											>
												<Edit2 className="h-3 w-3" />
											</Button>
											<ConfirmationButton
												variant="outline"
												size="xs"
												onClick={() => removeGroupMutation.mutate(group.id)}
												disabled={removeGroupMutation.isPending}
												title="Delete Group"
												description={`Are you sure you want to delete "${group.name}"? Its projects will become ungrouped.`}
												confirmText="Delete"
											>
												<Trash2 className="h-3 w-3" />
											</ConfirmationButton>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				</DialogContent>
			</Dialog>

			{/* Create Group Modal */}
			<ProjectGroupModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{/* Edit Group Modal */}
			<ProjectGroupModal
				group={editingGroup}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</>
	);
}
