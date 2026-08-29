import type { TagResponseDto as Tag } from "@repo/sdk";
import { tagControllerCreate, tagControllerUpdate } from "@repo/sdk";
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

type TagModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Tag being edited. `null`/omitted puts the modal in "create" mode. */
	tag?: Tag | null;
	onSuccess?: () => void;
};

/**
 * Single modal handling both tag creation and editing. Which mutation runs
 * (and whether the form starts blank or prefilled) is derived entirely from
 * whether a `tag` was passed in, so the two flows can't drift apart.
 */
export function TagModal({
	open,
	onOpenChange,
	tag = null,
	onSuccess,
}: TagModalProps) {
	const isEditing = tag !== null;
	const [name, setName] = React.useState("");
	const [color, setColor] = React.useState(DEFAULT_COLOR);
	const queryClient = useQueryClient();

	// Reset (create mode) or prefill (edit mode) the form whenever the modal
	// opens, or the tag being edited changes.
	React.useEffect(() => {
		if (!open) return;
		if (tag) {
			setName(tag.name || "");
			setColor(tag.color || DEFAULT_COLOR);
		} else {
			setName("");
			setColor(DEFAULT_COLOR);
		}
	}, [open, tag]);

	const saveTagMutation = useMutation({
		mutationFn: async (payload: { name: string; color: string }) => {
			if (isEditing) {
				if (!tag) throw new Error("No tag selected");
				const res = await tagControllerUpdate({
					path: { id: tag.id },
					body: payload,
				});
				return res.data;
			}
			const res = await tagControllerCreate({
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success(
				isEditing ? "Tag updated successfully" : "Tag created successfully",
			);
			queryClient.invalidateQueries({ queryKey: ["tags", "all"] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: toastApiError(isEditing ? "update tag" : "create tag"),
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Tag name cannot be empty.",
			});
			return;
		}

		if (!color.trim()) {
			toast.warning("Empty color", {
				description: "Tag color cannot be empty.",
			});
			return;
		}

		saveTagMutation.mutate({
			name: name.trim(),
			color: color.trim(),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-sm shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						{isEditing ? `Edit Tag #${tag?.id}` : "Create Tag"}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						{isEditing
							? "Modify tag details and preview colors dynamically."
							: "Define a new categorical tag with a name and display color."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					{/* Tag Name Input */}
					<FormField label="Tag Name" htmlFor="tag-name">
						<Input
							id="tag-name"
							placeholder="e.g. CONFIDENTIAL"
							className={HUD_INPUT_CLASS}
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saveTagMutation.isPending}
							maxLength={50}
							required
						/>
					</FormField>

					{/* Tag Color Input */}
					<FormField label="Tag Color" htmlFor="tag-color" className="gap-2">
						<div className="flex items-center gap-2">
							<Input
								id="tag-color"
								type="text"
								placeholder="#00f2ff"
								className={`${HUD_INPUT_CLASS} font-mono flex-1`}
								value={color}
								onChange={(e) => setColor(e.target.value)}
								disabled={saveTagMutation.isPending}
								required
							/>
							<div
								className="size-9 rounded border border-line/45 shrink-0 transition-all duration-200"
								style={{ backgroundColor: color }}
								title="Current Color Preview"
							/>
						</div>

						{/* Presets */}
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
							disabled={saveTagMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={saveTagMutation.isPending}
						>
							{saveTagMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									{isEditing ? "Saving..." : "Creating..."}
								</>
							) : isEditing ? (
								"Save Changes"
							) : (
								"Create Tag"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
