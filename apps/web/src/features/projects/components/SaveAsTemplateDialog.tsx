import type { ProjectResponseDto } from "@repo/sdk";
import { projectControllerSaveAsTemplate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import type { JSX } from "react";
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
import { toastApiError } from "#/lib/api-error.ts";

type SaveAsTemplateDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	project: ProjectResponseDto;
};

/**
 * Asks for a name and creates a new template from `project`, copying its
 * notes (with their links and canvas layout). The source project is left
 * untouched.
 */
export function SaveAsTemplateDialog({
	open,
	onOpenChange,
	project,
}: SaveAsTemplateDialogProps): JSX.Element {
	const [name, setName] = React.useState("");
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	React.useEffect(() => {
		if (open) setName(`${project.name} (template)`.slice(0, 150));
	}, [open, project.name]);

	const saveMutation = useMutation({
		mutationFn: async (templateName: string) => {
			const res = await projectControllerSaveAsTemplate({
				path: { id: project.id },
				body: { name: templateName },
			});
			return res.data as ProjectResponseDto;
		},
		onSuccess: (template) => {
			queryClient.invalidateQueries({ queryKey: ["projects", "templates"] });
			onOpenChange(false);
			toast.success("Template created", {
				description: `“${template.name}” is now available when creating projects.`,
				action: {
					label: "Open",
					onClick: () =>
						navigate({
							to: "/projects/$projectId",
							params: { projectId: String(template.id) },
						}),
				},
			});
		},
		onError: toastApiError("save template"),
	});

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			toast.warning("Empty name", {
				description: "Template name cannot be empty.",
			});
			return;
		}
		saveMutation.mutate(trimmed);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Save as Template
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Copies this project's notes, their links and canvas layout into a
						new template. Uploaded files and log entries are not copied. This
						project stays unchanged.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<FormField label="Template Name" htmlFor="template-name">
						<Input
							id="template-name"
							className={HUD_INPUT_CLASS}
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saveMutation.isPending}
							maxLength={150}
							required
						/>
					</FormField>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={saveMutation.isPending}
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" disabled={saveMutation.isPending}>
							{saveMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Saving...
								</>
							) : (
								"Save Template"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
