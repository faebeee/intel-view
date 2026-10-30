import { tagControllerCreate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { McButton } from "#/features/common/components/McButton.tsx";
import { StatusChip } from "#/features/common/components/StatusChip.tsx";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";

/**
 * Swatches from the Tags artboard. Tag colours are stored on the tag as
 * hex strings (they're data, not theme), so these are literal values that
 * mirror the design's signal tokens rather than CSS variables. Any other
 * colour can still be set via the edit dialog's colour picker.
 */
export const TAG_SWATCHES = [
	{ label: "Lime", hex: "#C6FF3D" },
	{ label: "Cyan", hex: "#4FD8FF" },
	{ label: "Amber", hex: "#FFB547" },
	{ label: "Red", hex: "#FF4D6D" },
	{ label: "Violet", hex: "#B88CFF" },
	{ label: "Gray", hex: "#7A8781" },
] as const;

const LABEL_CLASS =
	"font-mono text-[10.5px] tracking-[0.12em] text-mc-text-2 uppercase";

/**
 * Inline "New tag" panel (Tags artboard): name, colour swatches, live
 * chip preview and a primary submit. Uses the same create endpoint and
 * cache invalidation as `TagModal`.
 */
export function TagCreateForm(): JSX.Element {
	const queryClient = useQueryClient();
	const [name, setName] = React.useState("");
	const [color, setColor] = React.useState<string>(TAG_SWATCHES[0].hex);
	const nameId = React.useId();

	const createTagMutation = useMutation({
		mutationFn: async (payload: { name: string; color: string }) => {
			const res = await tagControllerCreate({ body: payload });
			return res.data;
		},
		onSuccess: () => {
			toast.success("Tag created successfully");
			queryClient.invalidateQueries({ queryKey: ["tags", "all"] });
			setName("");
		},
		onError: toastApiError("create tag"),
	});

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!name.trim()) {
			toast.warning("Empty name", {
				description: "Tag name cannot be empty.",
			});
			return;
		}
		createTagMutation.mutate({ name: name.trim(), color });
	};

	return (
		<div className="cut-tr-lg max-w-[400px] flex-[1_1_320px] bg-mc-border-strong p-px max-sm:max-w-none">
			<form
				aria-label="Create tag"
				onSubmit={handleSubmit}
				className="cut-tr-lg-inner flex flex-col gap-5 bg-mc-panel p-6"
			>
				<h2 className="m-0 font-display text-lg font-semibold tracking-[0.04em] uppercase">
					New tag
				</h2>

				<div className="flex flex-col gap-2">
					<label htmlFor={nameId} className={LABEL_CLASS}>
						Name
					</label>
					<input
						id={nameId}
						type="text"
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="privesc"
						autoComplete="off"
						className="h-11 border border-mc-border-strong bg-mc-bg px-3 font-mono text-sm text-mc-text outline-none placeholder:text-mc-text-muted focus:border-mc-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--mc-accent)_14%,transparent)]"
					/>
				</div>

				<fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
					<legend className={cn(LABEL_CLASS, "pb-2.5")}>Color</legend>
					<div className="flex flex-wrap gap-1.5">
						{TAG_SWATCHES.map((swatch) => {
							const selected = color === swatch.hex;
							return (
								<button
									key={swatch.hex}
									type="button"
									aria-label={swatch.label}
									aria-pressed={selected}
									onClick={() => setColor(swatch.hex)}
									className={cn(
										"flex size-11 cursor-pointer items-center justify-center border bg-mc-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
										selected ? "border-mc-text" : "border-mc-border-strong",
									)}
								>
									<span
										aria-hidden="true"
										className="size-[18px]"
										style={{
											backgroundColor: swatch.hex,
											boxShadow: selected ? `0 0 10px ${swatch.hex}` : "none",
										}}
									/>
								</button>
							);
						})}
					</div>
				</fieldset>

				<div className="flex flex-col gap-2">
					<span className={LABEL_CLASS}>Preview</span>
					<div className="flex min-h-12 items-center border border-dashed border-mc-border-strong px-3">
						<StatusChip color={color} size="md">
							{name.trim() || "privesc"}
						</StatusChip>
					</div>
				</div>

				<McButton
					type="submit"
					variant="primary"
					size="lg"
					wrapperClassName="flex"
					className="w-full"
					disabled={createTagMutation.isPending}
				>
					<Plus strokeWidth={2.2} />
					{createTagMutation.isPending ? "Creating..." : "Create tag"}
				</McButton>
			</form>
		</div>
	);
}
