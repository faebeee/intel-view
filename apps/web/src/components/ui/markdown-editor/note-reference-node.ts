import { mergeAttributes, Node, nodeInputRule } from "@tiptap/core";
import type MarkdownIt from "markdown-it";

/**
 * Matches `[[NOTE_ID]]` — the syntax used throughout the app to reference
 * another note from markdown content. Kept in sync with the rendering-side
 * regex in `#/components/ui/markdown/note-reference-extension.ts`.
 */
const NOTE_REFERENCE_INPUT_REGEX = /\[\[(\d+)\]\]$/;
const NOTE_REFERENCE_TOKEN_NAME = "note_reference";
const NOTE_REFERENCE_ATTR = "data-note-reference";
const NOTE_ID_ATTR = "data-note-id";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		noteReference: {
			/** Inserts a `[[NOTE_ID]]` reference node at the current selection. */
			insertNoteReference: (noteId: number) => ReturnType;
		};
	}
}

/**
 * Registers a `markdown-it` inline rule so that raw `[[NOTE_ID]]` text
 * (e.g. loaded from the database, or pasted in) is parsed into the same
 * `note_reference` token/markup the input rule below produces live, letting
 * both paths converge on a single ProseMirror node representation.
 */
function setupMarkdownIt(md: MarkdownIt): void {
	md.inline.ruler.before("text", NOTE_REFERENCE_TOKEN_NAME, (state, silent) => {
		const match = /^\[\[(\d+)\]\]/.exec(state.src.slice(state.pos));
		if (!match) return false;

		if (!silent) {
			const token = state.push(NOTE_REFERENCE_TOKEN_NAME, "", 0);
			token.attrs = [[NOTE_ID_ATTR, match[1]]];
		}
		state.pos += match[0].length;
		return true;
	});

	md.renderer.rules[NOTE_REFERENCE_TOKEN_NAME] = (tokens, index) => {
		const noteId = tokens[index].attrs?.find(([name]) => name === NOTE_ID_ATTR)?.[1];
		return `<span ${NOTE_REFERENCE_ATTR} ${NOTE_ID_ATTR}="${noteId}"></span>`;
	};
}

/**
 * Tiptap node representing a `[[NOTE_ID]]` reference to another note.
 * Renders as an atomic, non-editable inline chip so it behaves as a single
 * unit while editing, and round-trips to/from the literal `[[NOTE_ID]]`
 * markdown text via `tiptap-markdown`'s per-node `storage.markdown` hooks.
 */
export const NoteReference = Node.create({
	name: "noteReference",
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,

	addAttributes() {
		return {
			noteId: {
				default: null,
				parseHTML: (element: HTMLElement) => {
					const value = element.getAttribute(NOTE_ID_ATTR);
					return value ? Number(value) : null;
				},
				renderHTML: (attributes: Record<string, unknown>) => ({
					[NOTE_ID_ATTR]: attributes.noteId,
				}),
			},
		};
	},

	parseHTML() {
		return [{ tag: `span[${NOTE_REFERENCE_ATTR}]` }];
	},

	renderHTML({ HTMLAttributes }) {
		const noteId = HTMLAttributes[NOTE_ID_ATTR];
		return [
			"span",
			mergeAttributes(HTMLAttributes, {
				[NOTE_REFERENCE_ATTR]: "",
				class:
					"inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border border-palm/30 bg-palm/10 text-palm align-middle select-none",
			}),
			`🔗 Note #${noteId}`,
		];
	},

	addCommands() {
		return {
			insertNoteReference:
				(noteId: number) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs: { noteId } }),
		};
	},

	addInputRules() {
		return [
			nodeInputRule({
				find: NOTE_REFERENCE_INPUT_REGEX,
				type: this.type,
				getAttributes: (match) => ({ noteId: Number(match[1]) }),
			}),
		];
	},

	addStorage() {
		return {
			markdown: {
				serialize(state: { write: (text: string) => void }, node: { attrs: { noteId: number } }) {
					state.write(`[[${node.attrs.noteId}]]`);
				},
				parse: {
					setup: setupMarkdownIt,
				},
			},
		};
	},
});
