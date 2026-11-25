import {
	isSoftwareNoteType,
	NOTE_VERSION_MAX_LENGTH,
	type NoteType,
} from "#/types/note.ts";
import { CANVAS_GRID_CELL_HEIGHT, CANVAS_GRID_CELL_WIDTH } from "./types";

/**
 * Clipboard interchange format for creating notes by pasting JSON into the
 * canvas. Specified in `docs/note-import-format.md` (keep both in sync); the
 * JSON Schema lives in `docs/note-import-format.schema.json`.
 */
export const NOTE_IMPORT_FORMAT = "intel-view/notes";
export const NOTE_IMPORT_VERSION = 1;
/** Upper bound on notes per paste, to keep a stray huge paste from flooding a project. */
export const NOTE_IMPORT_MAX_NOTES = 500;

const NOTE_TYPE_SLUG_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** One note as written by an external tool (see the spec for field semantics). */
export type ImportNoteInput = {
	ref?: string;
	type?: string;
	title?: string;
	content?: string;
	tags?: string[];
	color?: string;
	version?: string;
	entries?: string[];
	parents?: (string | number)[];
	children?: ImportNoteInput[];
};

export type NoteImportDocument = {
	format: typeof NOTE_IMPORT_FORMAT;
	version: typeof NOTE_IMPORT_VERSION;
	source?: string;
	notes: ImportNoteInput[];
};

/** A validated note ready to be created, in creation order (parents before children). */
export type PlannedNote = {
	/** Internal key, unique within the plan (the `ref` if given, else a generated one). */
	key: string;
	type: NoteType;
	title?: string;
	content?: string;
	tags?: string[];
	color?: string;
	version?: string;
	entries: string[];
	/** Keys of parents created by this same import. */
	parentKeys: string[];
	/** IDs of notes that already exist in the project. */
	existingParentIds: number[];
	/** Offset from the paste origin, in canvas units. */
	offset: { x: number; y: number };
};

export type NoteImportPlan = {
	source?: string;
	notes: PlannedNote[];
};

export type NoteImportParseResult =
	/** Text is not an Intel View notes document; let the paste fall through. */
	| { kind: "not-import" }
	/** Text claims to be a notes document but is invalid. */
	| { kind: "error"; errors: string[] }
	| { kind: "ok"; plan: NoteImportPlan };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

const NOTE_KEYS = new Set([
	"ref",
	"type",
	"title",
	"content",
	"tags",
	"color",
	"version",
	"entries",
	"parents",
	"children",
]);

type FlatNote = Omit<PlannedNote, "offset" | "parentKeys"> & {
	parentRefs: string[];
	path: string;
};

/**
 * Parses clipboard text. Returns `not-import` for anything that isn't a JSON
 * object with `"format": "intel-view/notes"`, so ordinary pastes are left
 * alone. Validation collects every problem it finds rather than stopping at
 * the first one, so a producing tool can fix its output in one go.
 */
export function parseNoteImport(text: string): NoteImportParseResult {
	const trimmed = text.trim();
	if (!trimmed.startsWith("{")) return { kind: "not-import" };
	let raw: unknown;
	try {
		raw = JSON.parse(trimmed);
	} catch {
		return { kind: "not-import" };
	}
	if (!isRecord(raw) || raw.format !== NOTE_IMPORT_FORMAT) {
		return { kind: "not-import" };
	}

	const errors: string[] = [];
	if (raw.version !== NOTE_IMPORT_VERSION) {
		return {
			kind: "error",
			errors: [
				`Unsupported version ${JSON.stringify(raw.version)} (expected ${NOTE_IMPORT_VERSION}).`,
			],
		};
	}
	if (raw.source !== undefined && typeof raw.source !== "string") {
		errors.push("source must be a string.");
	}
	if (!Array.isArray(raw.notes) || raw.notes.length === 0) {
		return { kind: "error", errors: ["notes must be a non-empty array."] };
	}

	const flat: FlatNote[] = [];
	let generated = 0;

	const visit = (
		input: unknown,
		path: string,
		nestedParentKey: string | null,
	): void => {
		if (!isRecord(input)) {
			errors.push(`${path}: must be an object.`);
			return;
		}
		for (const key of Object.keys(input)) {
			if (!NOTE_KEYS.has(key)) errors.push(`${path}: unknown field "${key}".`);
		}

		const optionalString = (field: string): string | undefined => {
			const value = input[field];
			if (value === undefined || value === null) return undefined;
			if (typeof value !== "string") {
				errors.push(`${path}.${field}: must be a string.`);
				return undefined;
			}
			return value;
		};
		const stringArray = (field: string): string[] | undefined => {
			const value = input[field];
			if (value === undefined) return undefined;
			if (
				!Array.isArray(value) ||
				!value.every((item) => typeof item === "string")
			) {
				errors.push(`${path}.${field}: must be an array of strings.`);
				return undefined;
			}
			return value as string[];
		};

		const ref = optionalString("ref");
		if (ref !== undefined && ref.length === 0) {
			errors.push(`${path}.ref: must not be empty.`);
		}
		// NUL prefix: generated keys can never collide with a JSON-supplied ref.
		const key = ref || `\u0000auto-${generated++}`;

		const type = optionalString("type") ?? "standard";
		if (!NOTE_TYPE_SLUG_PATTERN.test(type)) {
			errors.push(
				`${path}.type: "${type}" is not a lowercase slug (letters, digits, hyphens; max 40 chars).`,
			);
		}
		if (type === "file") {
			errors.push(
				`${path}.type: "file" notes can't be imported (they need an uploaded file).`,
			);
		}

		const title = optionalString("title");
		const content = optionalString("content");
		const tags = stringArray("tags");

		const color = optionalString("color");
		if (color !== undefined && !HEX_COLOR_PATTERN.test(color)) {
			errors.push(`${path}.color: must be a hex color like "#00f2ff".`);
		}

		const version = optionalString("version");
		if (version !== undefined) {
			if (!isSoftwareNoteType(type)) {
				errors.push(
					`${path}.version: only allowed on software/service types, not "${type}".`,
				);
			}
			if (version.length > NOTE_VERSION_MAX_LENGTH) {
				errors.push(
					`${path}.version: longer than ${NOTE_VERSION_MAX_LENGTH} characters.`,
				);
			}
		}

		const entries = stringArray("entries") ?? [];
		if (entries.length > 0 && type !== "log") {
			errors.push(`${path}.entries: only allowed on "log" notes.`);
		}

		const parentRefs: string[] = nestedParentKey ? [nestedParentKey] : [];
		const existingParentIds: number[] = [];
		const parents = input.parents;
		if (parents !== undefined) {
			if (!Array.isArray(parents)) {
				errors.push(`${path}.parents: must be an array.`);
			} else {
				for (const parent of parents) {
					if (typeof parent === "string" && parent.length > 0) {
						parentRefs.push(parent);
					} else if (Number.isInteger(parent) && (parent as number) > 0) {
						existingParentIds.push(parent as number);
					} else {
						errors.push(
							`${path}.parents: ${JSON.stringify(parent)} is neither a ref nor a note ID.`,
						);
					}
				}
			}
		}

		flat.push({
			key,
			path,
			type: type as NoteType,
			title,
			content,
			tags,
			color,
			version,
			entries,
			parentRefs: [...new Set(parentRefs)],
			existingParentIds: [...new Set(existingParentIds)],
		});

		const children = input.children;
		if (children !== undefined) {
			if (!Array.isArray(children)) {
				errors.push(`${path}.children: must be an array.`);
			} else {
				children.forEach((child, i) => {
					visit(child, `${path}.children[${i}]`, key);
				});
			}
		}
	};

	raw.notes.forEach((note, i) => {
		visit(note, `notes[${i}]`, null);
	});

	if (flat.length > NOTE_IMPORT_MAX_NOTES) {
		errors.push(
			`Too many notes (${flat.length}); at most ${NOTE_IMPORT_MAX_NOTES} per paste.`,
		);
	}

	const byKey = new Map<string, FlatNote>();
	for (const note of flat) {
		if (byKey.has(note.key)) {
			errors.push(`${note.path}.ref: duplicate ref "${note.key}".`);
		}
		byKey.set(note.key, note);
	}
	for (const note of flat) {
		for (const parentRef of note.parentRefs) {
			if (!byKey.has(parentRef)) {
				errors.push(`${note.path}.parents: unknown ref "${parentRef}".`);
			} else if (parentRef === note.key) {
				errors.push(`${note.path}.parents: a note can't be its own parent.`);
			}
		}
	}
	if (errors.length > 0) return { kind: "error", errors };

	const ordered = topologicalOrder(flat, byKey);
	if (!ordered) {
		return {
			kind: "error",
			errors: ["parents contain a cycle; links must form a hierarchy."],
		};
	}

	return {
		kind: "ok",
		plan: {
			source: raw.source as string | undefined,
			notes: layout(ordered),
		},
	};
}

/** Kahn's algorithm, stable with respect to document order. Returns null on a cycle. */
function topologicalOrder(
	flat: FlatNote[],
	byKey: Map<string, FlatNote>,
): FlatNote[] | null {
	const remaining = new Map(
		flat.map((note) => [note.key, note.parentRefs.length]),
	);
	const childrenOf = new Map<string, FlatNote[]>();
	for (const note of flat) {
		for (const parentRef of note.parentRefs) {
			const list = childrenOf.get(parentRef) ?? [];
			list.push(note);
			childrenOf.set(parentRef, list);
		}
	}
	const queue = flat.filter((note) => note.parentRefs.length === 0);
	const result: FlatNote[] = [];
	while (queue.length > 0) {
		const note = queue.shift() as FlatNote;
		result.push(note);
		for (const child of childrenOf.get(note.key) ?? []) {
			const left = (remaining.get(child.key) ?? 0) - 1;
			remaining.set(child.key, left);
			if (left === 0) queue.push(child);
		}
	}
	return result.length === byKey.size ? result : null;
}

/** Columns by depth in the imported hierarchy, rows in creation order within each column. */
function layout(ordered: FlatNote[]): PlannedNote[] {
	const depth = new Map<string, number>();
	const rows = new Map<number, number>();
	return ordered.map((note) => {
		const d =
			note.parentRefs.length === 0
				? 0
				: Math.max(...note.parentRefs.map((key) => depth.get(key) ?? 0)) + 1;
		depth.set(note.key, d);
		const row = rows.get(d) ?? 0;
		rows.set(d, row + 1);
		const { parentRefs, path: _path, ...rest } = note;
		return {
			...rest,
			parentKeys: parentRefs,
			offset: {
				x: d * CANVAS_GRID_CELL_WIDTH,
				y: row * CANVAS_GRID_CELL_HEIGHT,
			},
		};
	});
}
