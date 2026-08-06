import { projectControllerCreate } from "@repo/sdk";
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

type CreateProjectModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

export function CreateProjectModal({
	open,
	onOpenChange,
	onSuccess,
}: CreateProjectModalProps) {
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const queryClient = useQueryClient();

	// Reset form when modal closes or opens
	React.useEffect(() => {
		if (!open) {
			setName("");
			setDescription("");
		}
	}, [open]);

	const createProjectMutation = useMutation({
		mutationFn: async (payload: { name: string; description?: string }) => {
			const res = await projectControllerCreate({
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Project created successfully");
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to create project:", err);
			toast.error("Failed to create project", {
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

		createProjectMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Create Project
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Projects group related notes and tags together.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="project-name"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Project Name
						</label>
						<Input
							id="project-name"
							placeholder="e.g. Operation Blue Horizon"
							className="bg-[#040814]/60 border-line text-xs focus-visible:ring-palm/30"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={createProjectMutation.isPending}
							maxLength={150}
							required
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="project-description"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Description (optional)
						</label>
						<Textarea
							id="project-description"
							placeholder="Briefly describe this project..."
							className="bg-[#040814]/60 border-line text-xs focus-visible:ring-palm/30 min-h-20"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={createProjectMutation.isPending}
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={createProjectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={createProjectMutation.isPending}
						>
							{createProjectMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Creating...
								</>
							) : (
								"Create Project"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
