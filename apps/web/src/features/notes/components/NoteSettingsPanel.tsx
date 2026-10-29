import type { NoteResponseDto as Note, TagResponseDto as Tag } from "@repo/sdk";
import { Trash2 } from "lucide-react";
import * as React from "react";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from "#/components/ui/combobox.tsx";
import { FormField } from "#/components/ui/form-field.tsx";
import { ColorPickerField } from "#/features/common/components/ColorPickerField.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { NoteHistorySection } from "#/features/notes/components/NoteHistorySection.tsx";
import { NotePluginsPanel } from "#/features/notes/components/NotePluginsPanel.tsx";
import { useNoteHistoryQuery } from "#/features/notes/hooks/useNoteHistoryQuery.ts";
import {
	getNoteLabel,
	useInvalidChildIds,
	useInvalidParentIds,
} from "#/features/notes/hooks/useNoteTree.ts";
import { useTagColorMap } from "#/features/tags/hooks/useTagColorMap.ts";

type NoteSettingsPanelProps = {
	projectId: number;
	note: Note;
	notes: Note[];
	tags: Tag[];
	onAddParent: (parentId: number) => void;
	onRemoveParent: (parentId: number) => void;
	onAddChild: (childId: number) => void;
	onRemoveChild: (childId: number) => void;
	onTagsChange: (tags: string[]) => void;
	onColorChange: (color: string | null) => void;
	onDelete: () => void;
	isMutating?: boolean;
	className?: string;
};

/**
 * Right-column panel exposing metadata/settings for the currently open
 * note: which notes it's linked under/over (parent/child pickers, excluding
 * self and any relation that would create a cycle), its tags (multi-select
 * sourced from the global tag registry, with free-text entries allowed
 * for tags not yet in the registry), timestamps, and delete.
 */
export function NoteSettingsPanel({
	projectId,
	note,
	notes,
	tags,
	onAddParent,
	onRemoveParent,
	onAddChild,
	onRemoveChild,
	onTagsChange,
	onColorChange,
	onDelete,
	isMutating = false,
	className,
}: NoteSettingsPanelProps) {
	const notesById = React.useMemo(
		() => new Map(notes.map((n) => [n.id, n])),
		[notes],
	);

	const invalidParentIds = useInvalidParentIds(notes, note.id);
	const parentOptions = React.useMemo(
		() => notes.filter((n) => !invalidParentIds.has(n.id)),
		[notes, invalidParentIds],
	);
	const currentParents = React.useMemo(
		() =>
			(note.parentIds ?? [])
				.map((id) => notesById.get(id))
				.filter((n): n is Note => n !== undefined),
		[note.parentIds, notesById],
	);
	const handleParentsChange = React.useCallback(
		(value: Note[]) => {
			const nextIds = new Set(value.map((n) => n.id));
			const previousIds = new Set(currentParents.map((n) => n.id));
			for (const id of nextIds) {
				if (!previousIds.has(id)) onAddParent(id);
			}
			for (const id of previousIds) {
				if (!nextIds.has(id)) onRemoveParent(id);
			}
		},
		[currentParents, onAddParent, onRemoveParent],
	);

	const invalidChildIds = useInvalidChildIds(notes, note.id);
	const childOptions = React.useMemo(
		() => notes.filter((n) => !invalidChildIds.has(n.id)),
		[notes, invalidChildIds],
	);
	const currentChildren = React.useMemo(
		() =>
			(note.childIds ?? [])
				.map((id) => notesById.get(id))
				.filter((n): n is Note => n !== undefined),
		[note.childIds, notesById],
	);
	const handleChildrenChange = React.useCallback(
		(value: Note[]) => {
			const nextIds = new Set(value.map((n) => n.id));
			const previousIds = new Set(currentChildren.map((n) => n.id));
			for (const id of nextIds) {
				if (!previousIds.has(id)) onAddChild(id);
			}
			for (const id of previousIds) {
				if (!nextIds.has(id)) onRemoveChild(id);
			}
		},
		[currentChildren, onAddChild, onRemoveChild],
	);

	const tagColorMap = useTagColorMap(tags);
	const tagAnchor = useComboboxAnchor();
	const [tagQuery, setTagQuery] = React.useState("");

	const noteTags = note.tags ?? [];
	const registryTagNames = React.useMemo(() => tags.map((t) => t.name), [tags]);

	const trimmedQuery = tagQuery.trim();
	const canCreateTag =
		trimmedQuery !== "" &&
		!registryTagNames.some(
			(t) => t.toLowerCase() === trimmedQuery.toLowerCase(),
		) &&
		!noteTags.some((t) => t.toLowerCase() === trimmedQuery.toLowerCase());

	const tagItems = React.useMemo(() => {
		const names = Array.from(new Set([...registryTagNames, ...noteTags]));
		return canCreateTag ? [...names, trimmedQuery] : names;
	}, [registryTagNames, noteTags, canCreateTag, trimmedQuery]);

	const { data: historyEntries = [], isLoading: isHistoryLoading } =
		useNoteHistoryQuery(projectId, note.id);

	const firstTag = noteTags[0];
	const firstTagColor = firstTag
		? tagColorMap.get(firstTag.toLowerCase())
		: undefined;

	return (
		<div className={className}>
			<div className="flex flex-col gap-5 p-3">
				<span className="text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft px-1">
					Note Settings
				</span>

				<div className="flex flex-col gap-1 px-1">
					<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
						Type
					</span>
					<span className="text-xs font-mono text-sea-ink-soft">
						{note.type === "log"
							? "Log"
							: note.type === "file"
								? "File"
								: note.type === "url"
									? "Link"
									: note.type === "ip"
										? "IP Address"
										: "Standard"}
					</span>
				</div>

				<NotePluginsPanel
					projectId={projectId}
					noteId={note.id}
					className="px-1"
				/>

				<FormField label="Parent Notes" htmlFor="note-parents" className="px-1">
					<Combobox
						items={parentOptions}
						multiple
						value={currentParents}
						onValueChange={(value) => handleParentsChange(value as Note[])}
						itemToStringLabel={(n: Note) => getNoteLabel(n)}
						isItemEqualToValue={(a: Note, b: Note) => a.id === b.id}
					>
						<ComboboxChips>
							<ComboboxValue>
								{(value: Note[]) => (
									<>
										{value.map((parent) => (
											<ComboboxChip key={parent.id}>
												{getNoteLabel(parent)}
											</ComboboxChip>
										))}
										<ComboboxChipsInput
											id="note-parents"
											placeholder={value.length ? "" : "No parents (root note)"}
											disabled={isMutating}
										/>
									</>
								)}
							</ComboboxValue>
						</ComboboxChips>
						<ComboboxContent>
							<ComboboxEmpty>No notes found.</ComboboxEmpty>
							<ComboboxList>
								{(item: Note) => (
									<ComboboxItem key={item.id} value={item}>
										<span className="font-mono text-[10px] font-bold text-palm shrink-0">
											#{item.id}
										</span>
										<span className="truncate">{getNoteLabel(item)}</span>
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</FormField>

				<FormField label="Child Notes" htmlFor="note-children" className="px-1">
					<Combobox
						items={childOptions}
						multiple
						value={currentChildren}
						onValueChange={(value) => handleChildrenChange(value as Note[])}
						itemToStringLabel={(n: Note) => getNoteLabel(n)}
						isItemEqualToValue={(a: Note, b: Note) => a.id === b.id}
					>
						<ComboboxChips>
							<ComboboxValue>
								{(value: Note[]) => (
									<>
										{value.map((child) => (
											<ComboboxChip key={child.id}>
												{getNoteLabel(child)}
											</ComboboxChip>
										))}
										<ComboboxChipsInput
											id="note-children"
											placeholder={value.length ? "" : "No children"}
											disabled={isMutating}
										/>
									</>
								)}
							</ComboboxValue>
						</ComboboxChips>
						<ComboboxContent>
							<ComboboxEmpty>No notes found.</ComboboxEmpty>
							<ComboboxList>
								{(item: Note) => (
									<ComboboxItem key={item.id} value={item}>
										<span className="font-mono text-[10px] font-bold text-palm shrink-0">
											#{item.id}
										</span>
										<span className="truncate">{getNoteLabel(item)}</span>
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</FormField>

				<FormField label="Tags" htmlFor="note-tags" className="px-1">
					<Combobox
						items={tagItems}
						multiple
						autoHighlight
						value={noteTags}
						onValueChange={(value) => onTagsChange(value as string[])}
						onInputValueChange={(value) => setTagQuery(value)}
					>
						{/* Must not be `display: contents` (e.g. Tailwind's `contents` class) — that
						collapses this element to a zero-size box, which Base UI's floating
						positioning reads as "anchor hidden" and renders the popup pinned to
						the page's top-left corner instead of under the tags input. */}
						<div ref={tagAnchor}>
							<ComboboxChips>
								<ComboboxValue>
									{(value: string[]) => (
										<>
											{value.map((tag) => {
												const color =
													tagColorMap.get(tag.toLowerCase()) ||
													"var(--primary)";
												return (
													<ComboboxChip
														key={tag}
														style={{
															backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
															color,
														}}
													>
														{tag}
													</ComboboxChip>
												);
											})}
											<ComboboxChipsInput
												id="note-tags"
												placeholder={value.length ? "" : "Add tags..."}
												disabled={isMutating}
											/>
										</>
									)}
								</ComboboxValue>
							</ComboboxChips>
						</div>
						<ComboboxContent anchor={tagAnchor}>
							<ComboboxEmpty>
								{trimmedQuery
									? "Press enter to create this tag."
									: "No tags found."}
							</ComboboxEmpty>
							<ComboboxList>
								{(tag: string) => (
									<ComboboxItem key={tag} value={tag}>
										{canCreateTag && tag === trimmedQuery ? (
											<span>
												Create tag{" "}
												<span className="font-bold">&ldquo;{tag}&rdquo;</span>
											</span>
										) : (
											<span
												className="truncate"
												style={{ color: tagColorMap.get(tag.toLowerCase()) }}
											>
												{tag}
											</span>
										)}
									</ComboboxItem>
								)}
							</ComboboxList>
						</ComboboxContent>
					</Combobox>
				</FormField>

				<FormField label="Note Color" htmlFor="note-color" className="px-1">
					<ColorPickerField
						id="note-color"
						value={note.color ?? null}
						onChange={(color) => onColorChange(color)}
						onClear={note.color ? () => onColorChange(null) : undefined}
						previewFallbackColor={firstTagColor}
						placeholder={firstTagColor ?? "#00f2ff"}
						disabled={isMutating}
					/>
					<span className="text-[10px] text-muted-foreground pt-1">
						{note.color
							? "Custom color set."
							: firstTagColor
								? `Using color from tag "${firstTag}".`
								: "No custom color set."}
					</span>
				</FormField>

				<div className="flex flex-col gap-1 px-1 pt-2 border-t border-line/50">
					<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
						Created
					</span>
					<span className="text-xs font-mono text-sea-ink-soft">
						{new Date(note.createdAt).toLocaleString()}
					</span>
				</div>
				<div className="flex flex-col gap-1 px-1">
					<span className="text-[9px] text-muted-foreground uppercase tracking-wider">
						Updated
					</span>
					<span className="text-xs font-mono text-sea-ink-soft">
						{new Date(note.updatedAt).toLocaleString()}
					</span>
				</div>

				<NoteHistorySection
					entries={historyEntries}
					isLoading={isHistoryLoading}
					className="px-1 pt-2 border-t border-line/50"
				/>

				<ConfirmationButton
					variant="outline"
					size="sm"
					className="mx-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30"
					title="Delete Note"
					description="Are you sure you want to permanently delete this note? Any notes linked to it as children will remain (losing this parent connection)."
					confirmText="Delete"
					disabled={isMutating}
					onClick={() => onDelete()}
				>
					<Trash2 className="h-3.5 w-3.5" />
					<span>Delete Note</span>
				</ConfirmationButton>
			</div>
		</div>
	);
}
