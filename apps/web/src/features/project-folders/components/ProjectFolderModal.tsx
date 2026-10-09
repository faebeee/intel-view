import type { ProjectFolderResponseDto } from "@repo/sdk";
import {
	projectFolderControllerCreate,
	projectFolderControllerUpdate,
} from "@repo/sdk";
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
import { FormField, HUD_INPUT_CLASS } from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { toastApiError } from "#/lib/api-error.ts";

const PRESET_COLORS = [
	{ name: "Tactical Red", value: "#ef4444" },
	{ name: "Laser Green", value: "#22c55e" },
	{ name: "Beacon Amber", value: "#eab308" },
	{ name: "Deep Sea", value: "#3b82f6" },
	{ name: "HUD Cyan", value: "#00f2ff" },
	{ name: "Sector Purple", value: "#a855f7" },
	{ name: "Stealth Slate", value: "#64748b" },
];

const DEFAULT_COLOR = "#00f2ff";

type ProjectFolderModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Folder being edited. `null`/omitted puts the modal in "create" mode. */
	folder?: ProjectFolderResponseDto | null;
	onSuccess?: () => void;
};

/**
 * Single modal handling both project folder creation and editing, mirroring
 * the ProjectModal/TagModal pattern: whether we're editing is derived purely
 * from whether a `folder` was passed in.
 */
export function ProjectFolderModal({
	open,
	onOpenChange,
	folder = null,
	onSuccess,
}: ProjectFolderModalProps) {
	const isEditing = folder !== null;
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [color, setColor] = React.useState(DEFAULT_COLOR);
	const queryClient = useQueryClient();

	React.useEffect(() => {
		if (!open) return;
		if (folder) {
			setName(folder.name || "");
			setDescription(folder.description || "");
			setColor(folder.color || DEFAULT_COLOR);
		} else {
			setName("");
			setDescription("");
			setColor(DEFAULT_COLOR);
		}
	}, [open, folder]);

	const saveFolderMutation = useMutation({
		mutationFn: async (payload: {
			name: string;
			description?: string;
			color: string;
		}) => {
			if (isEditing) {
				if (!folder) throw new Error("No folder selected");
				const res = await projectFolderControllerUpdate({
					path: { id: folder.id },
					body: payload,
				});
				return res.data;
			}
			const res = await projectFolderControllerCreate({ body: payload });
			return res.data;
		},
		onSuccess: () => {
			toast.success(
				isEditing
					? "Folder updated successfully"
					: "Folder created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["project-folders"] });
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: toastApiError(isEditing ? "update folder" : "create folder"),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Folder name cannot be empty.",
			});
			return;
		}

		if (!color.trim()) {
			toast.warning("Empty color", {
				description: "Folder color cannot be empty.",
			});
			return;
		}

		saveFolderMutation.mutate({
			name: name.trim(),
			description: description.trim() || undefined,
			color: color.trim(),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-sm shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						{isEditing ? `Edit Folder #${folder?.id}` : "Create Folder"}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						{isEditing
							? "Update the folder name, description and color."
							: "Folders let you organize related projects together."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<FormField label="Folder Name" htmlFor="folder-name">
						<Input
							id="folder-name"
							placeholder="e.g. Active Operations"
							className={HUD_INPUT_CLASS}
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saveFolderMutation.isPending}
							maxLength={150}
							required
						/>
					</FormField>

					<FormField
						label="Description (optional)"
						htmlFor="folder-description"
					>
						<Textarea
							id="folder-description"
							placeholder="Briefly describe this folder..."
							className={`${HUD_INPUT_CLASS} min-h-16`}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={saveFolderMutation.isPending}
						/>
					</FormField>

					<FormField
						label="Folder Color"
						htmlFor="folder-color"
						className="gap-2"
					>
						<div className="flex items-center gap-2">
							<Input
								id="folder-color"
								type="text"
								placeholder="#00f2ff"
								className={`${HUD_INPUT_CLASS} font-mono flex-1`}
								value={color}
								onChange={(e) => setColor(e.target.value)}
								disabled={saveFolderMutation.isPending}
								required
							/>
							<div
								className="size-9 rounded border border-line/45 shrink-0 transition-all duration-200"
								style={{ backgroundColor: color }}
								title="Current Color Preview"
							/>
						</div>

						<div className="flex flex-wrap gap-1.5 pt-1">
							{PRESET_COLORS.map((preset) => (
								<button
									key={preset.value}
									type="button"
									onClick={() => setColor(preset.value)}
									className="size-5 rounded-full border border-black/40 hover:scale-110 active:scale-95 transition-all outline-none focus-visible:ring-1 focus-visible:ring-palm relative shrink-0"
									style={{ backgroundColor: preset.value }}
									title={preset.name}
								>
									{color === preset.value && (
										<span className="absolute inset-0 m-auto size-1.5 rounded-full bg-black/60" />
									)}
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
							disabled={saveFolderMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={saveFolderMutation.isPending}
						>
							{saveFolderMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									{isEditing ? "Saving..." : "Creating..."}
								</>
							) : isEditing ? (
								"Save Changes"
							) : (
								"Create Folder"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
