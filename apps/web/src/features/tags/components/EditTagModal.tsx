import { tagControllerUpdate } from "@repo/sdk";
import type { TagResponseDto as Tag } from "@repo/sdk";
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

type EditTagModalProps = {
	projectId: number;
	tag: Tag | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
};

const PRESET_COLORS = [
	{ name: "Tactical Red", value: "#ef4444" },
	{ name: "Laser Green", value: "#22c55e" },
	{ name: "Beacon Amber", value: "#eab308" },
	{ name: "Deep Sea", value: "#3b82f6" },
	{ name: "HUD Cyan", value: "#00f2ff" },
	{ name: "Sector Purple", value: "#a855f7" },
	{ name: "Stealth Slate", value: "#64748b" },
];

export function EditTagModal({
	projectId,
	tag,
	open,
	onOpenChange,
	onSuccess,
}: EditTagModalProps) {
	const [name, setName] = React.useState("");
	const [color, setColor] = React.useState("#00f2ff");
	const queryClient = useQueryClient();

	// Prefill form states when tag changes or modal opens
	React.useEffect(() => {
		if (tag && open) {
			setName(tag.name || "");
			setColor(tag.color || "#00f2ff");
		}
	}, [tag, open]);

	const updateTagMutation = useMutation({
		mutationFn: async (payload: { name: string; color: string }) => {
			if (!tag) throw new Error("No tag selected");
			const res = await tagControllerUpdate({
				path: { projectId, id: tag.id },
				body: {
					name: payload.name,
					color: payload.color,
				},
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Tag updated successfully");
			queryClient.invalidateQueries({ queryKey: ["tags", "all", projectId] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to update tag:", err);
			toast.error("Failed to update tag", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
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

		updateTagMutation.mutate({
			name: name.trim(),
			color: color.trim(),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-sm shadow-2xl shadow-black/80">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Edit Tag #{tag?.id}
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Modify tag details and preview colors dynamically.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 my-2">
					{/* Tag Name Input */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-tag-name"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Tag Name
						</label>
						<Input
							id="edit-tag-name"
							placeholder="e.g. CONFIDENTIAL"
							className="bg-[#040814]/60 border-line text-xs focus-visible:ring-palm/30"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={updateTagMutation.isPending}
							maxLength={50}
							required
						/>
					</div>

					{/* Tag Color Input */}
					<div className="flex flex-col gap-2">
						<label
							htmlFor="edit-tag-color"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Tag Color
						</label>
						<div className="flex items-center gap-2">
							<Input
								id="edit-tag-color"
								type="text"
								placeholder="#00f2ff"
								className="bg-[#040814]/60 border-line text-xs font-mono focus-visible:ring-palm/30 flex-1"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								disabled={updateTagMutation.isPending}
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
					</div>

					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={updateTagMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={updateTagMutation.isPending}
						>
							{updateTagMutation.isPending ? (
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
