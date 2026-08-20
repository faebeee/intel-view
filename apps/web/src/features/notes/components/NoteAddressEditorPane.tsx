import type { NoteLocationResponseDto, NoteResponseDto as Note } from "@repo/sdk";
import { noteControllerUpdate } from "@repo/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Save } from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";
import { LoadingState } from "#/components/ui/loading-state.tsx";
import { AllLocationsMap } from "#/features/map/components/AllLocationsMap.tsx";
import { LocationSearchBar } from "#/features/map/components/LocationSearchBar.tsx";
import type { GeocodeResult } from "#/features/map/lib/geocode.ts";
import type { NoteSaveStatus } from "#/features/notes/components/NoteEditorPane.tsx";
import { SaveStatusIndicator } from "#/features/notes/components/NoteEditorPane.tsx";
import { useNoteLocationsQuery } from "#/features/notes/hooks/useNoteLocationsQuery.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useUpdateProject } from "#/features/projects/hooks/useUpdateProject.ts";
import { toastApiError } from "#/lib/api-error.ts";
import { cn } from "#/lib/utils.ts";
import type { MapThemeId } from "#/features/map/lib/map-themes.ts";

type NoteAddressEditorPaneProps = {
	projectId: number;
	note: Note;
	title: string;
	onTitleChange: (title: string) => void;
	saveStatus: NoteSaveStatus;
	disabled?: boolean;
	className?: string;
};

/**
 * Center-column pane for `'address'`-type notes: the title input (same
 * autosave-driven control shared with the other panes), a reusable
 * `LocationSearchBar` to search-and-pick an address (same Photon-backed
 * search used by the map's location picker), and an editable address text
 * field with an explicit Save button — unlike standard note content, saving
 * an address triggers a server-side geocoding lookup, so it isn't autosaved
 * on every keystroke. Below the input, the resolved location is rendered
 * through the exact same `AllLocationsMap` component used by the
 * project-wide map view (same marker/popup styling, same persisted base map
 * theme), rather than a bespoke preview, so both stay visually and
 * behaviorally in sync automatically. Before the address is saved, a
 * client-side-only preview pin (from the search bar's selection) is shown
 * through that same component instead.
 */
export function NoteAddressEditorPane({
	projectId,
	note,
	title,
	onTitleChange,
	saveStatus,
	disabled = false,
	className,
}: NoteAddressEditorPaneProps) {
	const queryClient = useQueryClient();
	const [draftAddress, setDraftAddress] = React.useState(note.content ?? "");
	const [initializedNoteId, setInitializedNoteId] = React.useState(note.id);
	// A client-side preview pin/label picked from the search bar, shown on
	// the map immediately for feedback before the address is even saved.
	// The authoritative resolved location always comes from the note's own
	// `latitude`/`longitude`/`geocodedLabel` (set server-side via
	// `GeocodingService` once saved) — this is only a preview.
	const [previewPin, setPreviewPin] = React.useState<{
		lat: number;
		lng: number;
		label: string;
	} | null>(null);

	const { data: project } = useProjectQuery(projectId);
	const updateProjectMutation = useUpdateProject(projectId);
	const handleMapThemeChange = React.useCallback(
		(theme: MapThemeId) => {
			updateProjectMutation.mutate({ mapTheme: theme });
		},
		[updateProjectMutation],
	);

	const { data: noteLocations = [], isLoading: isLocationsLoading } =
		useNoteLocationsQuery(projectId, note.id);

	// Re-initialize the draft whenever the selected note changes, without
	// clobbering in-flight edits on background refetches of the same note.
	React.useEffect(() => {
		if (initializedNoteId === note.id) return;
		setDraftAddress(note.content ?? "");
		setPreviewPin(null);
		setInitializedNoteId(note.id);
	}, [note.id, note.content, initializedNoteId]);

	const updateAddressMutation = useMutation({
		mutationFn: async (content: string) => {
			const res = await noteControllerUpdate({
				path: { projectId, id: note.id },
				body: { content },
			});
			return res.data as Note;
		},
		onSuccess: () => {
			setPreviewPin(null);
			queryClient.invalidateQueries({
				queryKey: ["notes", "all", projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["notes", "locations", projectId, note.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["notes", "locations", "all", projectId],
			});
			queryClient.invalidateQueries({
				queryKey: ["notes", "history", projectId, note.id],
			});
		},
		onError: toastApiError("save address"),
	});

	const trimmedDraft = draftAddress.trim();
	const hasUnsavedChanges = trimmedDraft !== (note.content ?? "").trim();

	const handleSave = () => {
		if (updateAddressMutation.isPending) return;
		updateAddressMutation.mutate(draftAddress);
	};

	const handleSearchSelect = (result: GeocodeResult) => {
		setDraftAddress(result.label);
		setPreviewPin(result);
	};

	// While a search result hasn't been saved yet, show it as a synthetic,
	// client-side-only pin through the same `AllLocationsMap` used
	// everywhere else, so the preview looks identical to the real thing.
	// Once saved, fall back to the note's actual server-resolved location
	// (fetched via `useNoteLocationsQuery`, which already includes the
	// synthetic address pin the backend derives from `geocodeStatus`).
	const mapLocations = React.useMemo<NoteLocationResponseDto[]>(() => {
		if (previewPin) {
			return [
				{
					id: -note.id,
					noteId: note.id,
					noteLabel: getNoteLabel({ title, content: note.content }),
					tags: note.tags ?? [],
					lat: previewPin.lat,
					lng: previewPin.lng,
					label: previewPin.label,
					createdAt: new Date().toISOString(),
				},
			];
		}
		return noteLocations;
	}, [previewPin, noteLocations, note.id, note.tags, note.content, title]);

	return (
		<div
			className={cn(
				"flex flex-col gap-4 h-full min-h-0 p-4 overflow-y-auto",
				className,
			)}
		>
			<div className="flex items-center justify-between gap-3 shrink-0">
				<Input
					value={title}
					onChange={(e) => onTitleChange(e.target.value)}
					placeholder="Untitled address"
					disabled={disabled}
					className="border-none bg-transparent px-1 text-lg font-bold text-sea-ink shadow-none focus-visible:ring-0 h-auto"
				/>
				<SaveStatusIndicator status={saveStatus} />
			</div>

			<div className="flex flex-col gap-2 shrink-0">
				<label
					htmlFor="note-address-input"
					className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
				>
					Address
				</label>
				<LocationSearchBar
					onSelect={handleSearchSelect}
					placeholder="Search for an address or place..."
				/>
				<div className="flex items-center gap-2">
					<Input
						id="note-address-input"
						value={draftAddress}
						onChange={(e) => {
							setDraftAddress(e.target.value);
							setPreviewPin(null);
						}}
						placeholder="e.g. 1600 Amphitheatre Parkway, Mountain View, CA"
						disabled={disabled || updateAddressMutation.isPending}
					/>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={
							disabled ||
							!hasUnsavedChanges ||
							!trimmedDraft ||
							updateAddressMutation.isPending
						}
					>
						<Save className="h-3.5 w-3.5" />
						<span>{updateAddressMutation.isPending ? "Saving..." : "Save"}</span>
					</Button>
				</div>
				{previewPin && (
					<span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
						Preview — save to confirm this location
					</span>
				)}
			</div>

			<div className="flex-1 min-h-0 flex flex-col gap-2 border-t border-line/50 pt-3">
				{isLocationsLoading && !previewPin ? (
					<LoadingState label="Loading location..." compact />
				) : mapLocations.length > 0 ? (
					<AllLocationsMap
						projectId={String(projectId)}
						locations={mapLocations}
						mapTheme={project?.mapTheme}
						onMapThemeChange={handleMapThemeChange}
						className="flex-1 min-h-40 rounded-lg overflow-hidden border border-line/50"
					/>
				) : note.geocodeStatus === "failed" ? (
					<div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-xs text-red-400">
						<AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
						<span>
							Couldn't resolve this address:{" "}
							{note.geocodeError ?? "unknown error"}. Fix the address above and
							save again.
						</span>
					</div>
				) : (
					<p className="text-xs text-muted-foreground">
						Enter an address above and save to resolve its map location.
					</p>
				)}
			</div>
		</div>
	);
}
