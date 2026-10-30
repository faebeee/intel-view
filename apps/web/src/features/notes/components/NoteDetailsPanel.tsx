import type { NoteResponseDto as Note } from "@repo/sdk";
import { Pencil, Trash2, X } from "lucide-react";
import * as React from "react";
import { Markdown } from "#/components/ui/markdown.tsx";
import { TagChipList } from "#/components/ui/tag-chip.tsx";
import { noteKind } from "#/features/canvas/note-kind.ts";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import { NoteHistoryList } from "#/features/notes/components/NoteHistorySection.tsx";
import { NoteLogEntryList } from "#/features/notes/components/NoteLogEntryList.tsx";
import { NotePluginsPanel } from "#/features/notes/components/NotePluginsPanel.tsx";
import { useDeleteNote } from "#/features/notes/hooks/useDeleteNote.ts";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import { useNoteLogEntriesQuery } from "#/features/notes/hooks/useNoteLogEntriesQuery.ts";
import { getNoteLabel } from "#/features/notes/hooks/useNoteTree.ts";
import { useResolvedNoteContentQuery } from "#/features/notes/hooks/useResolvedNoteContentQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";
import { formatIsoDateTime } from "#/lib/format.ts";
import { cn } from "#/lib/utils.ts";

export type NoteDetailsPanelProps = {
	projectId: number;
	note: Note;
	notes: Note[];
	/** When provided, renders a close (X) button in the header — used by views (e.g. canvas) with no other way to deselect the note. */
	onClose?: () => void;
	/** When provided, renders an "Edit note" button that opens the note in an in-place editor modal instead of navigating away. */
	onEdit?: () => void;
	/** Called after the note is successfully deleted, so the caller can clear its selection. */
	onDeleted?: () => void;
	className?: string;
};

type InspectorTab = "details" | "output" | "history";

const TABS: { id: InspectorTab; label: string }[] = [
	{ id: "details", label: "Details" },
	{ id: "output", label: "Output" },
	{ id: "history", label: "History" },
];

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** One key/value row of the DETAILS list (92px key column). */
function Fact({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}): React.JSX.Element {
	return (
		<div className="flex gap-3 border-b border-mc-row-divider py-2.5">
			<dt className="w-[92px] shrink-0 pt-0.5 font-mono text-[10.5px] tracking-[0.1em] text-mc-text-muted uppercase">
				{label}
			</dt>
			<dd className="m-0 min-w-0 flex-1 font-mono text-[12.5px] [overflow-wrap:anywhere] text-mc-text">
				{children}
			</dd>
		</div>
	);
}

/**
 * Canvas inspector (handoff §03 "Inspector"), shown while a note is
 * selected: kind · #id line, title, DETAILS / OUTPUT / HISTORY tabs and an
 * Edit note + delete footer. The design's stage line, parsed ports and
 * secret masking need new note data (handoff §04) and aren't shown.
 */
export function NoteDetailsPanel({
	projectId,
	note,
	notes,
	onClose,
	onEdit,
	onDeleted,
	className,
}: NoteDetailsPanelProps) {
	const [tab, setTab] = React.useState<InspectorTab>("details");
	const tabIds = React.useId();
	const tabRefs = React.useRef<Record<InspectorTab, HTMLButtonElement | null>>({
		details: null,
		output: null,
		history: null,
	});

	const parents = React.useMemo(
		() =>
			(note.parentIds ?? [])
				.map((id) => notes.find((n) => n.id === id))
				.filter((n): n is Note => n !== undefined),
		[notes, note.parentIds],
	);
	const { data: tags = [] } = useAllTagsQuery();
	const tagColorMap = useTagColorMap(tags);
	const { data: historyEntries = [], isLoading: isHistoryLoading } =
		useNoteHistoryQuery(projectId, note.id);
	const { data: logEntries = [], isLoading: isLogLoading } =
		useNoteLogEntriesQuery(
			projectId,
			note.type === "log" ? note.id : undefined,
		);
	const deleteNoteMutation = useDeleteNote(projectId);
	const isStandardTypeContent =
		note.type !== "log" && note.type !== "url" && note.type !== "ip";
	const { data: resolvedContent } = useResolvedNoteContentQuery(
		projectId,
		isStandardTypeContent ? note.id : undefined,
	);
	const kind = noteKind(note);

	const handleDelete = React.useCallback(() => {
		deleteNoteMutation.mutate(note.id, { onSuccess: onDeleted });
	}, [deleteNoteMutation, note.id, onDeleted]);

	// Arrow keys move between tabs (roving tabindex, WAI-ARIA tabs pattern).
	const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
		const index = TABS.findIndex((t) => t.id === tab);
		let next: number | null = null;
		if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
		if (event.key === "ArrowLeft")
			next = (index - 1 + TABS.length) % TABS.length;
		if (event.key === "Home") next = 0;
		if (event.key === "End") next = TABS.length - 1;
		if (next === null) return;
		event.preventDefault();
		const id = TABS[next].id;
		setTab(id);
		tabRefs.current[id]?.focus();
	};

	const content = note.content?.trim() ?? "";

	return (
		<aside
			aria-label="Inspector"
			className={cn("flex min-h-0 flex-col bg-mc-rail", className)}
		>
			<div className="flex flex-col gap-2.5 px-5 pt-[18px]">
				<div className="flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.12em]">
					<span className="font-semibold" style={{ color: kind.color }}>
						{kind.label}
					</span>
					<span className="text-mc-text-muted">#{note.id}</span>
					<span className="flex-1" />
					{onClose && (
						<McButton
							variant="ghost"
							size="icon-sm"
							className="-mr-2"
							onClick={onClose}
							aria-label="Close inspector"
							title="Close"
						>
							<X className="size-4" />
						</McButton>
					)}
				</div>
				<h2 className="m-0 font-display text-[22px] leading-[1.2] font-semibold break-words">
					{getNoteLabel(note)}
				</h2>
				<div
					role="tablist"
					aria-label="Inspector views"
					className="mt-1.5 flex flex-wrap gap-x-5 border-b border-mc-border"
				>
					{TABS.map(({ id, label }) => {
						const selected = tab === id;
						return (
							<button
								key={id}
								ref={(el) => {
									tabRefs.current[id] = el;
								}}
								type="button"
								role="tab"
								id={`${tabIds}-tab-${id}`}
								aria-selected={selected}
								aria-controls={`${tabIds}-panel`}
								tabIndex={selected ? 0 : -1}
								onClick={() => setTab(id)}
								onKeyDown={onTabKeyDown}
								className={cn(
									"-mb-px h-10 cursor-pointer border-0 border-b-2 bg-transparent p-0 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent",
									selected
										? "border-mc-accent text-mc-text"
										: "border-transparent text-mc-text-muted hover:text-mc-text",
								)}
							>
								{label}
								{id === "history" && historyEntries.length > 0 && (
									<span className="ml-1.5 text-mc-text-muted">
										{historyEntries.length}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<div
				role="tabpanel"
				id={`${tabIds}-panel`}
				aria-labelledby={`${tabIds}-tab-${tab}`}
				className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto px-5 py-[18px]"
			>
				{tab === "details" && (
					<>
						<dl className="m-0 flex flex-col">
							<Fact label={parents.length > 1 ? "Parents" : "Parent"}>
								{parents.length > 0 ? (
									parents.map((p) => getNoteLabel(p)).join(", ")
								) : (
									<span className="text-mc-text-muted">— root note</span>
								)}
							</Fact>
							{note.type === "url" && (
								<Fact label="URL">
									{content ? (
										<a
											href={content}
											target="_blank"
											rel="noopener noreferrer"
											className="text-mc-data no-underline hover:underline"
										>
											{content}
										</a>
									) : (
										<span className="text-mc-text-muted">—</span>
									)}
								</Fact>
							)}
							{note.type === "ip" && (
								<Fact label="Address">
									{content || <span className="text-mc-text-muted">—</span>}
								</Fact>
							)}
							{note.type === "file" && (
								<Fact label="File">
									{note.fileName ? (
										<>
											{note.fileName}
											{note.fileSize != null && (
												<span className="text-mc-text-muted">
													{" "}
													· {formatBytes(note.fileSize)}
												</span>
											)}
										</>
									) : (
										<span className="text-mc-text-muted">—</span>
									)}
								</Fact>
							)}
							<Fact label="Children">
								{note.childIds?.length ? (
									`${note.childIds.length} ${note.childIds.length === 1 ? "note" : "notes"}`
								) : (
									<span className="text-mc-text-muted">—</span>
								)}
							</Fact>
							<Fact label="Tags">
								{note.tags && note.tags.length > 0 ? (
									<TagChipList tags={note.tags} tagColorMap={tagColorMap} />
								) : (
									<span className="text-mc-text-muted">—</span>
								)}
							</Fact>
							<Fact label="Created">{formatIsoDateTime(note.createdAt)}</Fact>
							<Fact label="Updated">{formatIsoDateTime(note.updatedAt)}</Fact>
						</dl>
						<NotePluginsPanel projectId={projectId} noteId={note.id} />
					</>
				)}

				{tab === "output" &&
					(note.type === "log" ? (
						<NoteLogEntryList entries={logEntries} isLoading={isLogLoading} />
					) : (
						<div className="border border-mc-border bg-mc-code-bg p-3.5 font-mono text-[11.5px] leading-[1.65] text-mc-text-soft">
							{content ? (
								isStandardTypeContent ? (
									<Markdown
										content={resolvedContent ?? note.content}
										className="text-xs [&_code]:text-inherit [&_pre]:m-0 [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_pre]:text-inherit [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere]"
									/>
								) : (
									<pre className="m-0 font-mono whitespace-pre-wrap [overflow-wrap:anywhere]">
										{content}
									</pre>
								)
							) : (
								<span className="text-mc-text-muted">No output captured.</span>
							)}
						</div>
					))}

				{tab === "history" && (
					<NoteHistoryList
						entries={historyEntries}
						isLoading={isHistoryLoading}
					/>
				)}
			</div>

			<div className="flex gap-2 border-t border-mc-border px-5 py-3.5">
				{onEdit && (
					<McButton
						variant="primary"
						size="lg"
						wrapperClassName="flex-1"
						className="w-full"
						onClick={onEdit}
					>
						<Pencil strokeWidth={2} />
						Edit note
					</McButton>
				)}
				<ConfirmationButton
					title={`Delete note #${note.id}?`}
					description="Linked child notes stay on the canvas but lose this parent link. This can't be undone."
					confirmText="Delete note"
					onClick={handleDelete}
					trigger={
						<McButton
							variant="danger"
							size="icon-lg"
							className="px-0"
							aria-label="Delete note"
							title="Delete note"
							disabled={deleteNoteMutation.isPending}
						>
							<Trash2 strokeWidth={1.75} />
						</McButton>
					}
				/>
			</div>
		</aside>
	);
}
