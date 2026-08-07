import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button.tsx";
import {
	FormField,
	TERMINAL_INPUT_CLASS,
} from "#/components/ui/form-field.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select.tsx";
import { CoordinateInputs } from "#/features/notes/components/CoordinateInputs.tsx";
import { NoteContentFields } from "#/features/notes/components/NoteContentFields.tsx";
import { NoteTypeBadge } from "#/features/notes/components/NoteTypeBadge.tsx";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { useNoteQuery } from "#/features/notes/hooks/useNoteQuery.ts";
import type { IframeNoteConfig } from "#/features/notes/noteTypes.ts";
import { invalidateNoteQueries } from "#/features/notes/utils/invalidateNoteQueries.ts";
import { getDescendantIds } from "#/features/notes/utils/noteTree.ts";
import { toastApiError } from "#/lib/api-error.ts";

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
			invalidateNoteQueries(queryClient, projectId, noteId);
			navigate({
				to: "/projects/$projectId/notes/$id",
				params: { projectId: projectIdParam, id },
			});
		},
		onError: toastApiError("update note"),
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
		return <LoadingState label="Loading note details..." />;
	}

	if (!note) {
		return (
			<NotFoundState
				message={`Note #${id} not found.`}
				backTo="/projects/$projectId/notes"
				backParams={{ projectId: projectIdParam }}
				backLabel="Back to Notes"
			/>
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
					<FormField label="Parent Note (Optional)" htmlFor="edit-note-parent">
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
					</FormField>

					{/* Type-conditional content fields (markdown / iframe / log) */}
					<NoteContentFields
						projectId={projectId}
						type={note.type}
						content={content}
						onContentChange={setContent}
						iframeUrl={iframeUrl}
						onIframeUrlChange={setIframeUrl}
						disabled={updateNoteMutation.isPending}
						idPrefix="edit-note"
						markdownMinHeight="min-h-56"
					/>

					{/* Tags Input */}
					<FormField
						label="Tags (separated by commas)"
						htmlFor="edit-note-tags"
					>
						<Input
							id="edit-note-tags"
							type="text"
							placeholder="e.g. location, family"
							className={TERMINAL_INPUT_CLASS}
							value={tagsInput}
							onChange={(e) => setTagsInput(e.target.value)}
							disabled={updateNoteMutation.isPending}
						/>
					</FormField>

					{/* Coordinates */}
					<CoordinateInputs
						lat={lat}
						lng={lng}
						onLatChange={setLat}
						onLngChange={setLng}
						disabled={updateNoteMutation.isPending}
						hint="Leave coordinates blank to save as a non-geolocated note."
					/>

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
