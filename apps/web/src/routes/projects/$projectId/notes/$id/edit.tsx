import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { MarkdownEditor } from "#/components/ui/markdown-editor.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useNoteQuery } from "#/features/notes/hooks/useNoteQuery.ts";
import type { IframeNoteConfig } from "#/features/notes/noteTypes.ts";
import { getDescendantIds } from "#/features/notes/utils/noteTree.ts";

const ROOT_PARENT_VALUE = "root";

export const Route = createFileRoute("/projects/$projectId/notes/$id/edit")({
	component: NoteEditRouteComponent,
});

function NoteEditRouteComponent(): JSX.Element {
	const { projectId: projectIdParam, id } = Route.useParams();
	const projectId = parseInt(projectIdParam, 10);
	const noteId = parseInt(id, 10);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: note, isLoading } = useNoteQuery(projectId, noteId);
	const { data: allNotes = [] } = useAllNotesQuery(projectId);

	const [content, setContent] = React.useState("");
	const [iframeUrl, setIframeUrl] = React.useState("");
	const [lat, setLat] = React.useState("");
	const [lng, setLng] = React.useState("");
	const [tagsInput, setTagsInput] = React.useState("");
	const [parentId, setParentId] = React.useState<string>(ROOT_PARENT_VALUE);
	const [hasHydrated, setHasHydrated] = React.useState(false);

	// Prefill form state once the note has loaded
	React.useEffect(() => {
		if (note && !hasHydrated) {
			setContent(note.content || "");
			const config = (note.config || {}) as IframeNoteConfig;
			setIframeUrl(note.type === "iframe" ? config.url || "" : "");
			setLat(
				note.lat !== null && note.lat !== undefined ? String(note.lat) : "",
			);
			setLng(
				note.lng !== null && note.lng !== undefined ? String(note.lng) : "",
			);
			setTagsInput((note.tags || []).join(", "));
			setParentId(
				note.parentId !== null && note.parentId !== undefined
					? String(note.parentId)
					: ROOT_PARENT_VALUE,
			);
			setHasHydrated(true);
		}
	}, [note, hasHydrated]);

	// A note cannot be parented to itself or to any of its own descendants,
	// as that would create a circular hierarchy.
	const excludedParentIds = React.useMemo(() => {
		if (!note) return new Set<number>();
		return new Set([note.id, ...getDescendantIds(allNotes, note.id)]);
	}, [allNotes, note]);

	const parentOptions = React.useMemo(
		() => allNotes.filter((n) => !excludedParentIds.has(n.id)),
		[allNotes, excludedParentIds],
	);

	const updateNoteMutation = useMutation({
		mutationFn: async (payload: {
			content: string;
			config?: Record<string, unknown> | null;
			lat: number | null;
			lng: number | null;
			tags: string[];
			parentId: number | null;
		}) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: noteId },
				body: payload,
			});
			return res.data;
		},
		onSuccess: () => {
			toast.success("Note updated successfully");
			queryClient.invalidateQueries({ queryKey: ["notes", "all", projectId] });
			queryClient.invalidateQueries({ queryKey: ["notes", "map", projectId] });
			queryClient.invalidateQueries({
				queryKey: ["notes", projectId, noteId],
			});
			navigate({
				to: "/projects/$projectId/notes/$id",
				params: { projectId: projectIdParam, id },
			});
		},
		onError: (err) => {
			console.error("Failed to update note:", err);
			toast.error("Failed to update note", {
				description:
					err instanceof Error ? err.message : "Ensure the api is online.",
			});
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (note?.type === "markdown" && !content.trim()) {
			toast.warning("Empty content", {
				description: "Note content cannot be empty.",
			});
			return;
		}

		if (note?.type === "iframe") {
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

		let parsedLat: number | null = null;
		let parsedLng: number | null = null;

		if (lat.trim() !== "" || lng.trim() !== "") {
			parsedLat = parseFloat(lat);
			parsedLng = parseFloat(lng);

			if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
				toast.warning("Invalid coordinates", {
					description:
						"Ensure latitude and longitude values are valid decimals or leave both blank.",
				});
				return;
			}
		}

		const tagsArray = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		updateNoteMutation.mutate({
			content: note?.type === "log" ? "" : content.trim(),
			config: note?.type === "iframe" ? { url: iframeUrl.trim() } : undefined,
			lat: parsedLat,
			lng: parsedLng,
			tags: tagsArray,
			parentId: parentId === ROOT_PARENT_VALUE ? null : parseInt(parentId, 10),
		});
	};

	if (isLoading) {
		return (
			<div className="min-h-full w-full bg-background/50 p-6 flex flex-col items-center justify-center py-40 font-mono text-xs text-[#00f2ff]">
				<div className="animate-pulse flex flex-col items-center gap-2">
					<span>Loading note details...</span>
				</div>
			</div>
		);
	}

	if (!note) {
		return (
			<div className="min-h-full w-full bg-background/50 p-6 flex flex-col items-center justify-center py-40 gap-4">
				<p className="font-mono text-xs text-red-400">Note #{id} not found.</p>
				<Link
					to="/projects/$projectId/notes"
					params={{ projectId: projectIdParam }}
				>
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-3 w-3" />
						<span>Back to Notes</span>
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
			{/* Breadcrumb Navigation */}
			<div className="flex items-center justify-between border-b border-line pb-4">
				<Link
					to="/projects/$projectId/notes/$id"
					params={{ projectId: projectIdParam, id }}
				>
					<Button variant="outline" size="xs">
						<ArrowLeft className="h-3 w-3" />
						<span>BACK TO NOTE</span>
					</Button>
				</Link>
			</div>

			{/* Edit Card */}
			<div className="rounded-lg border border-line bg-surface-strong/90 backdrop-blur-md shadow-2xl shadow-black/80 flex flex-col overflow-hidden">
				<div className="p-6 border-b border-line pb-5 space-y-1.5">
					<span className="text-[10px] tracking-wider text-[#00f2ff] uppercase font-bold font-mono">
						Note Registry
					</span>
					<h1 className="text-2xl font-bold text-sea-ink leading-tight font-mono flex items-center gap-2">
						<span>Edit Note #{note.id}</span>
						<NoteTypeBadge type={note.type} />
					</h1>
				</div>

				<form onSubmit={handleSubmit} className="p-6 space-y-5">
					{/* Parent Note Selector */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-note-parent"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Parent Note (Optional)
						</label>
						<Select
							value={parentId}
							onValueChange={setParentId}
							disabled={updateNoteMutation.isPending}
						>
							<SelectTrigger id="edit-note-parent" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ROOT_PARENT_VALUE}>
									No parent (root note)
								</SelectItem>
								{parentOptions.map((n) => (
									<SelectItem key={n.id} value={String(n.id)}>
										#{n.id} — {(n.content || "").slice(0, 40) || "No content"}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Markdown Live Editor */}
					{note.type === "markdown" && (
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="edit-note-content"
								className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
							>
								Content (Markdown Supported)
							</label>
							<MarkdownEditor
								value={content}
								onChange={setContent}
								placeholder="Write markdown details here..."
								disabled={updateNoteMutation.isPending}
								minHeight="min-h-56"
							/>
						</div>
					)}

					{/* iFrame URL Configuration */}
					{note.type === "iframe" && (
						<div className="flex flex-col gap-3">
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="edit-note-iframe-url"
									className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
								>
									iFrame URL
								</label>
								<Input
									id="edit-note-iframe-url"
									type="url"
									placeholder="https://example.com"
									className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
									value={iframeUrl}
									onChange={(e) => setIframeUrl(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="edit-note-content"
									className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
								>
									Caption (Optional)
								</label>
								<Input
									id="edit-note-content"
									type="text"
									placeholder="Short description shown alongside the embed"
									className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
									value={content}
									onChange={(e) => setContent(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
						</div>
					)}

					{/* Log Note Info */}
					{note.type === "log" && (
						<div className="rounded-lg border border-line/50 bg-[#040814]/40 p-3 text-xs text-muted-foreground italic">
							Log notes have no content of their own. Their detail view directly
							displays this note's automatic change history, and lets you add
							your own freeform history entries.
						</div>
					)}

					{/* Tags Input */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-note-tags"
							className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1"
						>
							Tags (separated by commas)
						</label>
						<Input
							id="edit-note-tags"
							type="text"
							placeholder="e.g. location, family"
							className="bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-palm placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm"
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							disabled={updateNoteMutation.isPending}
						/>
					</div>

					{/* 2-column Lat/Lng prefilled inputs */}
					<div className="flex flex-col gap-1.5 max-w-md">
						<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1">
							Coordinates (Optional)
						</span>
						<div className="grid grid-cols-2 gap-3 p-3 bg-[#040814]/40 border border-line/50 rounded-lg">
							<div className="flex flex-col gap-1">
								<label
									htmlFor="edit-note-lat"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Latitude
								</label>
								<Input
									id="edit-note-lat"
									type="text"
									placeholder="e.g. 48.1351"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
									value={lat}
									onChange={(e) => setLat(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
							<div className="flex flex-col gap-1 border-l border-line/30 pl-3">
								<label
									htmlFor="edit-note-lng"
									className="text-[9px] uppercase font-mono text-muted-foreground"
								>
									Longitude
								</label>
								<Input
									id="edit-note-lng"
									type="text"
									placeholder="e.g. 11.5820"
									className="bg-transparent border-none p-0 text-xs font-mono h-auto text-palm focus-visible:ring-0 placeholder:text-muted-foreground/30"
									value={lng}
									onChange={(e) => setLng(e.target.value)}
									disabled={updateNoteMutation.isPending}
								/>
							</div>
						</div>
						<p className="text-[9px] text-muted-foreground italic pl-1">
							Leave coordinates blank to save as a non-geolocated note.
						</p>
					</div>

					<div className="flex items-center justify-end gap-2 pt-2 border-t border-line/30">
						<Link
							to="/projects/$projectId/notes/$id"
							params={{ projectId: projectIdParam, id }}
						>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={updateNoteMutation.isPending}
							>
								Cancel
							</Button>
						</Link>
						<Button
							type="submit"
							size="sm"
							disabled={updateNoteMutation.isPending}
						>
							{updateNoteMutation.isPending ? (
								<>
									<RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
									Saving...
								</>
							) : (
								"Save Changes"
							)}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
