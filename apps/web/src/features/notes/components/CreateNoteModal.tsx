import type { NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerCreate } from "@repo/sdk";
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
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import {
	NOTE_TYPE_OPTIONS,
	type NoteType,
} from "#/features/notes/noteTypes.ts";

const ROOT_PARENT_VALUE = "root";

type CreateNoteModalProps = {
	projectId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultLat?: number;
	defaultLng?: number;
	/** Notes available in the project, used to populate the parent selector. */
	notes?: Note[];
	/** Pre-selects a parent note (e.g. when adding a sub-note from the tree view). */
	defaultParentId?: number | null;
	onSuccess?: () => void;
};

export function CreateNoteModal({
	projectId,
	open,
	onOpenChange,
	defaultLat,
	defaultLng,
	notes = [],
	defaultParentId = null,
	onSuccess,
}: CreateNoteModalProps) {
	const [type, setType] = React.useState<NoteType>("markdown");
	const [content, setContent] = React.useState("");
	const [iframeUrl, setIframeUrl] = React.useState("");
	const [lat, setLat] = React.useState("");
	const [lng, setLng] = React.useState("");
	const [tagsInput, setTagsInput] = React.useState("");
	const [parentId, setParentId] = React.useState<string>(ROOT_PARENT_VALUE);
	const queryClient = useQueryClient();

	// Update lat and lng state whenever default props change
	React.useEffect(() => {
		if (defaultLat !== undefined) setLat(String(defaultLat));
		if (defaultLng !== undefined) setLng(String(defaultLng));
	}, [defaultLat, defaultLng]);

	// Reset form when modal closes or opens, pre-filling the parent if provided
	React.useEffect(() => {
		if (!open) {
			setType("markdown");
			setContent("");
			setIframeUrl("");
			setTagsInput("");
			setParentId(ROOT_PARENT_VALUE);
		} else {
			setParentId(
				defaultParentId !== null && defaultParentId !== undefined
					? String(defaultParentId)
					: ROOT_PARENT_VALUE,
			);
		}
	}, [open, defaultParentId]);

	const createNoteMutation = useMutation({
		mutationFn: async (payload: {
			type: NoteType;
			content: string;
			config?: Record<string, unknown> | null;
			lat: number;
			lng: number;
			tags: string[];
			parentId: number | null;
		}) => {
			const res = await noteControllerCreate({
				path: { projectId },
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note added successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
			onOpenChange(false);
			if (onSuccess) onSuccess();
		},
		onError: (err) => {
			console.error("Failed to create note:", err);
			toast.error("Failed to add note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (type === "markdown" && !content.trim()) {
			toast.warning("Empty content", {
				description: "Note content cannot be empty.",
			});
			return;
		}

		if (type === "iframe") {
			if (!iframeUrl.trim()) {
				toast.warning("Missing iframe URL", {
					description: "Enter the URL to embed in this note.",
				});
				return;
			}
			try {
				new URL(iframeUrl.trim());
			} catch {
				toast.warning("Invalid iframe URL", {
					description: "Enter a valid, fully-qualified URL (e.g. https://...).",
				});
				return;
			}
		}

		const tagsArray = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		createNoteMutation.mutate({
			type,
			content: content.trim(),
			config: type === "iframe" ? { url: iframeUrl.trim() } : undefined,
			lat: parseFloat(lat),
			lng: parseFloat(lng),
			tags: tagsArray,
			parentId: parentId === ROOT_PARENT_VALUE ? null : parseInt(parentId, 10),
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md md:max-w-3xl lg:max-w-4xl shadow-2xl shadow-black/80 duration-200 transition-all">
				<DialogHeader className="space-y-1">
					<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
						Add Note
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
						Create a new note with markdown preview and tags.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-5 my-2">
					{/* Note Type Selector */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="note-type"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Note Type
						</label>
						<Select
							value={type}
							onValueChange={(value) => setType(value as NoteType)}
							disabled={createNoteMutation.isPending}
						>
							<SelectTrigger id="note-type" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{NOTE_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Parent Note Selector */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="note-parent"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Parent Note (Optional)
						</label>
						<Select
							value={parentId}
							onValueChange={setParentId}
							disabled={createNoteMutation.isPending}
						>
							<SelectTrigger id="note-parent" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ROOT_PARENT_VALUE}>
									No parent (root note)
								</SelectItem>
								{notes.map((n) => (
									<SelectItem key={n.id} value={String(n.id)}>
										#{n.id} — {(n.content || "").slice(0, 40) || "No content"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Markdown Live Editor */}
					{type === "markdown" && (
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="note-content"
								className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
							>
								Content (Markdown Supported)
							</label>
							<MarkdownEditor
								value={content}
								onChange={setContent}
								placeholder="Write content here..."
								disabled={createNoteMutation.isPending}
								minHeight="min-h-36"
							/>
						</div>
					)}

					{/* iFrame URL Configuration */}
					{type === "iframe" && (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="note-iframe-url"
									className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
								>
									iFrame URL
								</label>
								<Input
									id="note-iframe-url"
									type="url"
									placeholder="https://example.com"
									className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
									value={iframeUrl}
									onChange={(e) => setIframeUrl(e.target.value)}
									disabled={createNoteMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="note-content"
									className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
								>
									Caption (Optional)
								</label>
								<Input
									id="note-content"
									type="text"
									placeholder="Short description shown alongside the embed"
									className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									disabled={createNoteMutation.isPending}
								/>
							</div>
						</div>
					)}

					{/* Tags Input */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="note-tags"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Tags (separated by commas)
						</label>
						<Input
							id="note-tags"
							type="text"
							placeholder="e.g. location, family"
							className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							disabled={createNoteMutation.isPending}
						/>
					</div>

					{/* 2-column Lat/Lng prefilled inputs */}
					<div className="flex flex-col gap-1.5 max-w-md">
						<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
							Coordinates
						</span>
						<div className="grid grid-cols-2 gap-3 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
							<div className="flex flex-col gap-1">
								<label
									htmlFor="note-lat"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Latitude
								</label>
								<Input
									id="note-lat"
									type="text"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0"
									value={lat}
									onChange={(e) => setLat(e.target.value)}
									disabled={createNoteMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1 border-l border-line/30 pl-3">
								<label
									htmlFor="note-lng"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Longitude
								</label>
								<Input
									id="note-lng"
									type="text"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0"
									value={lng}
									onChange={(e) => setLng(e.target.value)}
									disabled={createNoteMutation.isPending}
								/>
							</div>
						</div>
					</div>

					<DialogFooter className="pt-2 border-t border-line/30">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							disabled={createNoteMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							variant="default"
							size="sm"
							disabled={createNoteMutation.isPending}
						>
							{createNoteMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Adding...
								</>
							) : (
								"Add Note"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
