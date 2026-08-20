import type { ProjectGroupResponseDto } from "@repo/sdk";
import {
	projectGroupControllerCreate,
	projectGroupControllerUpdate,
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

type ProjectGroupModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Group being edited. `null`/omitted puts the modal in "create" mode. */
	group?: ProjectGroupResponseDto | null;
	onSuccess?: () => void;
};

/**
 * Single modal handling both project group creation and editing, mirroring
 * the ProjectModal/TagModal pattern: whether we're editing is derived purely
 * from whether a `group` was passed in.
 */
export function ProjectGroupModal({
	open,
	onOpenChange,
	group = null,
	onSuccess,
}: ProjectGroupModalProps) {
	const isEditing = group !== null;
	const [name, setName] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [color, setColor] = React.useState(DEFAULT_COLOR);
	const queryClient = useQueryClient();

	React.useEffect(() => {
		if (!open) return;
		if (group) {
			setName(group.name || "");
			setDescription(group.description || "");
			setColor(group.color || DEFAULT_COLOR);
		} else {
			setName("");
			setDescription("");
			setColor(DEFAULT_COLOR);
		}
	}, [open, group]);

	const saveGroupMutation = useMutation({
		mutationFn: async (payload: {
			name: string;
			description?: string;
			color: string;
		}) => {
			if (isEditing) {
				if (!group) throw new Error("No group selected");
				const res = await projectGroupControllerUpdate({
					path: { id: group.id },
					body: payload,
				});
				return res.data;
			}
			const res = await projectGroupControllerCreate({ body: payload });
			return res.data;
		},
		onSuccess: () => {
			toast.success(
				isEditing ? "Group updated successfully" : "Group created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["project-groups", "all"] });
			queryClient.invalidateQueries({ queryKey: ["projects", "all"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: toastApiError(isEditing ? "update group" : "create group"),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Group name cannot be empty.",
			});
			return;
		}

		if (!color.trim()) {
			toast.warning("Empty color", {
				description: "Group color cannot be empty.",
			});
			return;
		}

		saveGroupMutation.mutate({
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
						{isEditing ? `Edit Group #${group?.id}` : "Create Group"}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						{isEditing
							? "Update the group name, description and color."
							: "Groups let you organize related projects together."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					<FormField label="Group Name" htmlFor="group-name">
						<Input
							id="group-name"
							placeholder="e.g. Active Operations"
							className={HUD_INPUT_CLASS}
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saveGroupMutation.isPending}
							maxLength={150}
							required
						/>
					</FormField>

					<FormField
						label="Description (optional)"
						htmlFor="group-description"
					>
						<Textarea
							id="group-description"
							placeholder="Briefly describe this group..."
							className={`${HUD_INPUT_CLASS} min-h-16`}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={saveGroupMutation.isPending}
						/>
					</FormField>

					<FormField label="Group Color" htmlFor="group-color" className="gap-2">
						<div className="flex items-center gap-2">
							<Input
								id="group-color"
								type="text"
								placeholder="#00f2ff"
								className={`${HUD_INPUT_CLASS} font-mono flex-1`}
								value={color}
								onChange={(e) => setColor(e.target.value)}
								disabled={saveGroupMutation.isPending}
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
							disabled={saveGroupMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={saveGroupMutation.isPending}
						>
							{saveGroupMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									{isEditing ? "Saving..." : "Creating..."}
								</>
							) : isEditing ? (
								"Save Changes"
							) : (
								"Create Group"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
