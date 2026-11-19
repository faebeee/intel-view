import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerRemove } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import {
	PageHeader,
	PageShell,
	StatusBar,
} from "#/features/common/components/PageShell.tsx";
import { ProjectModal } from "#/features/projects/components/ProjectModal.tsx";
import { ProjectTable } from "#/features/projects/components/ProjectTable.tsx";
import { useTemplatesQuery } from "#/features/projects/hooks/useTemplatesQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";

export const Route = createFileRoute("/templates")({
	component: TemplatesPage,
});

/**
 * Lists template projects. A template is edited like any project (open it
 * to add notes on its canvas); its notes are copied into every project
 * created from it.
 */
function TemplatesPage(): JSX.Element {
	const queryClient = useQueryClient();
	const {
		data: templates = [],
		isLoading,
		isRefetching,
		refetch,
	} = useTemplatesQuery();

	const [isCreateOpen, setIsCreateOpen] = React.useState(false);
	const [editingTemplate, setEditingTemplate] =
		React.useState<ProjectResponseDto | null>(null);
	const [isEditOpen, setIsEditOpen] = React.useState(false);

	const removeTemplateMutation = useMutation({
		mutationFn: async (templateId: number) => {
			const res = await projectControllerRemove({ path: { id: templateId } });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Template deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["projects"] });
		},
		onError: toastApiError("delete template"),
	});

	const isBusy = isLoading || isRefetching;
	const countLabel = `${templates.length} ${templates.length === 1 ? "template" : "templates"}`;

	return (
		<PageShell
			contentClassName="px-8 pt-7 pb-10"
			header={
				<PageHeader
					kicker="Workspace"
					title="Templates"
					titleSuffix={
						<span className="font-mono text-[11px] tracking-[0.1em] text-mc-text-2 uppercase">
							{countLabel}
						</span>
					}
					actions={
						<>
							<McButton
								variant="icon"
								size="icon-md"
								onClick={() => refetch()}
								disabled={isBusy}
								aria-label="Refresh"
								title="Refresh"
							>
								<RefreshCw className={isBusy ? "animate-spin" : ""} />
							</McButton>
							<McButton variant="primary" onClick={() => setIsCreateOpen(true)}>
								<Plus strokeWidth={2.2} />
								New template
							</McButton>
						</>
					}
				/>
			}
			status={<StatusBar items={["Templates", countLabel]} />}
		>
			{isLoading && !isRefetching ? (
				<LoadingState label="Loading templates..." compact />
			) : (
				<ProjectTable
					projects={templates}
					emptyTitle="No templates yet"
					emptyDescription="Create a template here, or use “Save as template” on an existing project. Its notes are copied into new projects created from it."
					onEdit={(template) => {
						setEditingTemplate(template);
						setIsEditOpen(true);
					}}
					onDelete={(template) => removeTemplateMutation.mutate(template.id)}
					isDeleting={removeTemplateMutation.isPending}
				/>
			)}

			<ProjectModal
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				asTemplate
			/>

			<ProjectModal
				project={editingTemplate}
				open={isEditOpen}
				onOpenChange={setIsEditOpen}
			/>
		</PageShell>
	);
}
