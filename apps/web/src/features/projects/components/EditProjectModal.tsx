import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";

type EditProjectModalProps = {
	project: ProjectResponseDto | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function EditProjectModal({
	project,
	open,
	onOpenChange,
	onSuccess,
}: EditProjectModalProps) {
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const queryClient = useQueryClient();

	React.useEffect(() => {
		if (project && open) {
			setName(project.name || "");
			setDescription(project.description || "");
		}
	}, [project, open]);

	const updateProjectMutation = useMutation({
		mutationFn: async (payload: { name: string; description?: string }) => {
			if (!project) throw new Error("No project selected");
			const res = await projectControllerUpdate({
				path: { id: project.id },
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Project updated successfully");
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
			if (project) {
				queryClient.invalidateQueries({ queryKey: ["projects", project.id] });
			}
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to update project:", err);
			toast.error("Failed to update project", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Project name cannot be empty.",
			});
			return;
		}

		updateProjectMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Edit Project #{project?.id}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Update the project name and description.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-project-name"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Project Name
						</label>
						<Input
							id="edit-project-name"
							placeholder="e.g. Operation Blue Horizon"
							className="bg-[#040814]/60 border-line text-xs focus-visible:ring-palm/30"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={updateProjectMutation.isPending}
							maxLength={150}
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-project-description"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Description (optional)
						</label>
						<Textarea
							id="edit-project-description"
							placeholder="Briefly describe this project..."
							className="bg-[#040814]/60 border-line text-xs focus-visible:ring-palm/30 min-h-20"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={updateProjectMutation.isPending}
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={updateProjectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={updateProjectMutation.isPending}
						>
							{updateProjectMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
