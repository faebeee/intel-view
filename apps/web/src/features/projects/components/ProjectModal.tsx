import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerCreate, projectControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw } from "lucide-react";
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
import { FormField, HUD_INPUT_CLASS } from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "#/components/ui/native-select.tsx";
import { Textarea } from "#/components/ui/textarea";
import { useAllProjectFoldersQuery } from "#/features/project-folders/hooks/useAllProjectFoldersQuery.ts";
import { toastApiError } from "#/lib/api-error.ts";
import {
	COLOR_THEME_LABELS,
	COLOR_THEME_SWATCH,
	COLOR_THEMES,
	type ColorTheme,
	DEFAULT_COLOR_THEME,
} from "#/lib/theme.ts";

type ProjectModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Project being edited. `null`/omitted puts the modal in "create" mode. */
	project?: ProjectResponseDto | null;
	/**
	 * Folder to preselect when creating a new project from within a folder's
	 * detail page (e.g. clicking "New Project" while viewing a folder). Has no
	 * effect in edit mode, where the project's current folder is used instead.
	 */
	defaultFolderId?: number | null;
	onSuccess?: () => void;
};

/**
 * Single modal handling both project creation and editing. Which mutation
 * runs (and whether the form starts blank or prefilled) is derived entirely
 * from whether a `project` was passed in, so the two flows can't drift apart.
 */
export function ProjectModal({
	open,
	onOpenChange,
	project = null,
	defaultFolderId = null,
	onSuccess,
}: ProjectModalProps) {
	const isEditing = project !== null;
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [folderId, setFolderId] = React.useState<string>("");
	const [color, setColor] = React.useState<ColorTheme>(DEFAULT_COLOR_THEME);
	const queryClient = useQueryClient();
	const { data: folders = [] } = useAllProjectFoldersQuery();

	// Reset (create mode) or prefill (edit mode) the form whenever the modal
	// opens, or the project being edited changes.
	React.useEffect(() => {
		if (!open) return;
		if (project) {
			setName(project.name || "");
			setDescription(project.description || "");
			setFolderId(project.folderId != null ? String(project.folderId) : "");
			setColor((project.color as ColorTheme) || DEFAULT_COLOR_THEME);
		} else {
			setName("");
			setDescription("");
			setFolderId(defaultFolderId != null ? String(defaultFolderId) : "");
			setColor(DEFAULT_COLOR_THEME);
		}
	}, [open, project, defaultFolderId]);

	const saveProjectMutation = useMutation({
		mutationFn: async (payload: {
			name: string;
			description?: string;
			folderId: number | null;
			color: ColorTheme;
		}) => {
			if (isEditing) {
				if (!project) throw new Error("No project selected");
				const res = await projectControllerUpdate({
					path: { id: project.id },
					body: payload,
				});
				return res.data;
			}
			const res = await projectControllerCreate({ body: payload });
			return res.data;
		},
		onSuccess: () => {
			toast.success(
				isEditing
					? "Project updated successfully"
					: "Project created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({ queryKey: ["project-folders"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: toastApiError(isEditing ? "update project" : "create project"),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Project name cannot be empty.",
			});
			return;
		}

		saveProjectMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
			folderId: folderId ? Number(folderId) : null,
			color,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						{isEditing ? `Edit Project #${project?.id}` : "Create Project"}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						{isEditing
							? "Update the project name, description and accent color."
							: "Projects organize related notes together. Pick an accent color to make this project recognizable when open."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<FormField label="Project Name" htmlFor="project-name">
						<Input
							id="project-name"
							placeholder="e.g. Operation Blue Horizon"
							className={HUD_INPUT_CLASS}
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saveProjectMutation.isPending}
							maxLength={150}
							required
						/>
					</FormField>

					<FormField
						label="Description (optional)"
						htmlFor="project-description"
					>
						<Textarea
							id="project-description"
							placeholder="Briefly describe this project..."
							className={`${HUD_INPUT_CLASS} min-h-20`}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={saveProjectMutation.isPending}
						/>
					</FormField>

					<FormField label="Folder (optional)" htmlFor="project-folder">
						<NativeSelect
							id="project-folder"
							className={`${HUD_INPUT_CLASS} w-full`}
							value={folderId}
							onChange={(e) => setFolderId(e.target.value)}
							disabled={saveProjectMutation.isPending}
						>
							<NativeSelectOption value="">
								No folder (ungrouped)
							</NativeSelectOption>
							{folders.map((folder) => (
								<NativeSelectOption key={folder.id} value={String(folder.id)}>
									{folder.name}
								</NativeSelectOption>
							))}
						</NativeSelect>
					</FormField>

					<FormField
						label="Accent Color"
						htmlFor="project-color"
						className="gap-2"
					>
						<div className="flex flex-wrap gap-2">
							{COLOR_THEMES.map((option) => (
								<button
									key={option}
									type="button"
									id={option === color ? "project-color" : undefined}
									onClick={() => setColor(option)}
									disabled={saveProjectMutation.isPending}
									className="flex items-center gap-1.5 rounded-full border border-line/50 bg-surface/60 px-2.5 py-1 text-[11px] font-mono text-sea-ink hover:border-palm/40 transition-colors disabled:opacity-50"
									aria-pressed={color === option}
								>
									<span
										className={`size-3 rounded-full shrink-0 ${COLOR_THEME_SWATCH[option]}`}
									/>
									<span>{COLOR_THEME_LABELS[option]}</span>
									{color === option ? (
										<Check className="size-3 shrink-0" />
									) : null}
								</button>
							))}
						</div>
					</FormField>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={saveProjectMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={saveProjectMutation.isPending}
						>
							{saveProjectMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									{isEditing ? "Saving..." : "Creating..."}
								</>
							) : isEditing ? (
								"Save Changes"
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
