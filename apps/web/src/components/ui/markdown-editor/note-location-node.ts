import { mergeAttributes, Node, nodeInputRule } from "@tiptap/core";
import type MarkdownIt from "markdown-it";

/**
 * Matches a just-typed `[[geo:LAT,LNG,LABEL]]` token at the cursor position
 * (anchored to the end, non-global — unlike the shared, global
 * `NOTE_LOCATION_PATTERN` in `#/lib/note-locations.ts` used for scanning
 * whole documents, a live input-rule regex must not carry `lastIndex` state
 * between keystrokes).
 */
const NOTE_LOCATION_INPUT_REGEX = /\[\[geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),([^\]]*)\]\]$/;
const NOTE_LOCATION_TOKEN_NAME = "note_location";
const NOTE_LOCATION_ATTR = "data-note-location";
const LAT_ATTR = "data-lat";
const LNG_ATTR = "data-lng";
const LABEL_ATTR = "data-label";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		noteLocation: {
			/** Inserts a `[[geo:LAT,LNG,LABEL]]` location pin node at the current selection. */
			insertNoteLocation: (lat: number, lng: number, label?: string | null) => ReturnType;
		};
	}
}

/**
 * Registers a `markdown-it` inline rule so that raw `[[geo:LAT,LNG,LABEL]]`
 * text (e.g. loaded from the database, or pasted in) is parsed into the same
 * `note_location` token/markup the input rule below produces live, letting
 * both paths converge on a single ProseMirror node representation.
 */
function setupMarkdownIt(md: MarkdownIt): void {
	md.inline.ruler.before("text", NOTE_LOCATION_TOKEN_NAME, (state, silent) => {
		const pattern = /^\[\[geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),([^\]]*)\]\]/;
		const match = pattern.exec(state.src.slice(state.pos));
		if (!match) return false;

		if (!silent) {
			const token = state.push(NOTE_LOCATION_TOKEN_NAME, "", 0);
			token.attrs = [
				[LAT_ATTR, match[1]],
				[LNG_ATTR, match[2]],
				[LABEL_ATTR, match[3]],
			];
		}
		state.pos += match[0].length;
		return true;
	});

	md.renderer.rules[NOTE_LOCATION_TOKEN_NAME] = (tokens, index) => {
		const attrs = tokens[index].attrs ?? [];
		const get = (name: string) => attrs.find(([n]) => n === name)?.[1] ?? "";
		return (
			`<span ${NOTE_LOCATION_ATTR} ${LAT_ATTR}="${get(LAT_ATTR)}" ` +
			`${LNG_ATTR}="${get(LNG_ATTR)}" ${LABEL_ATTR}="${get(LABEL_ATTR)}"></span>`
		);
	};
}

/**
 * Tiptap node representing a `[[geo:LAT,LNG,LABEL]]` reference to a pinned
 * map location. Renders as an atomic, non-editable inline chip so it
 * behaves as a single unit while editing, and round-trips to/from the
 * literal `[[geo:LAT,LNG,LABEL]]` markdown text via `tiptap-markdown`'s
 * per-node `storage.markdown` hooks. Inserted via the map picker in the
 * editor toolbar (see `location-picker.tsx`).
 */
export const NoteLocation = Node.create({
	name: "noteLocation",
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,

	addAttributes() {
		return {
			lat: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					const value = element.getAttribute(LAT_ATTR);
					return value ? Number(value) : null;
				},
				renderHTML: (attributes: Record<string, unknown>) => ({
					[LAT_ATTR]: attributes.lat,
				}),
			},
			lng: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					const value = element.getAttribute(LNG_ATTR);
					return value ? Number(value) : null;
				},
				renderHTML: (attributes: Record<string, unknown>) => ({
					[LNG_ATTR]: attributes.lng,
				}),
			},
			label: {
				default: null,
				parseHTML: (element: HTMLElement) => element.getAttribute(LABEL_ATTR) || null,
				renderHTML: (attributes: Record<string, unknown>) => ({
					[LABEL_ATTR]: attributes.label ?? "",
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: `span[${NOTE_LOCATION_ATTR}]` }];
	},

	renderHTML({ HTMLAttributes }) {
		const lat = HTMLAttributes[LAT_ATTR];
		const lng = HTMLAttributes[LNG_ATTR];
		const label = HTMLAttributes[LABEL_ATTR];
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				[NOTE_LOCATION_ATTR]: "",
				class:
					"inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-palm/30 bg-palm/10 text-palm align-middle select-none",
			}),
			label ? `📍 ${label}` : `📍 ${lat}, ${lng}`,
		];
	},

	addCommands() {
		return {
			insertNoteLocation:
				(lat: number, lng: number, label?: string | null) =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						attrs: { lat, lng, label: label ?? null },
					}),
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: NOTE_LOCATION_INPUT_REGEX,
				type: this.type,
				getAttributes: (match) => ({
					lat: Number(match[1]),
					lng: Number(match[2]),
					label: match[3]?.trim() || null,
				}),
			}),
		];
	},

	addStorage() {
		return {
			markdown: {
				serialize(
					state: { write: (text: string) => void },
					node: { attrs: { lat: number; lng: number; label: string | null } },
				) {
					state.write(`[[geo:${node.attrs.lat},${node.attrs.lng},${node.attrs.label ?? ""}]]`);
				},
				parse: {
					setup: setupMarkdownIt,
				},
			},
		};
	},
});
