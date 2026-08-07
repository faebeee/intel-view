import type { InlineNode, MarkdownExtension } from "@tanstack/markdown";

/**
 * Custom inline node representing a `[[NOTE_ID]]` reference to another note.
 * Not part of `@tanstack/markdown`'s built-in `InlineNode` union, so it's
 * cast at the boundaries where it crosses into/out of that closed union
 * (see `transformInline`/`renderHtml` below).
 */
export type NoteReferenceNode = {
	type: "noteReference";
	noteId: number;
};

const NOTE_REFERENCE_PATTERN = /\[\[(\d+)\]\]/g;

/**
 * Splits a single text run into alternating text/note-reference nodes
 * wherever a `[[NOTE_ID]]` pattern is found. Returns the original node
 * (in a single-element array) unchanged when there's no match, so callers
 * can always splice the result in place of the original node.
 */
function splitTextNode(node: { type: "text"; value: string }): InlineNode[] {
	NOTE_REFERENCE_PATTERN.lastIndex = 0;
	if (!NOTE_REFERENCE_PATTERN.test(node.value)) {
		return [node];
	}
	NOTE_REFERENCE_PATTERN.lastIndex = 0;

	const result: InlineNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null = NOTE_REFERENCE_PATTERN.exec(node.value);
	while (match !== null) {
		if (match.index > lastIndex) {
			result.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
		}
		const noteReference: NoteReferenceNode = {
			type: "noteReference",
			noteId: Number(match[1]),
		};
		result.push(noteReference as unknown as InlineNode);
		lastIndex = match.index + match[0].length;
		match = NOTE_REFERENCE_PATTERN.exec(node.value);
	}
	if (lastIndex < node.value.length) {
		result.push({ type: "text", value: node.value.slice(lastIndex) });
	}
	return result;
}

/**
 * Recursively applies `[[NOTE_ID]]` detection to a list of inline nodes,
 * including the children of nodes that themselves wrap inline content
 * (strong/emphasis/strike/link), so references still work inside e.g.
 * `**[[12]]**` or link labels.
 */
function transformNodes(nodes: InlineNode[]): InlineNode[] {
	const result: InlineNode[] = [];
	for (const node of nodes) {
		switch (node.type) {
			case "text":
				result.push(...splitTextNode(node));
				break;
			case "strong":
			case "emphasis":
			case "strike":
				result.push({ ...node, children: transformNodes(node.children) });
				break;
			case "link":
				result.push({ ...node, children: transformNodes(node.children) });
				break;
			default:
				result.push(node);
				break;
		}
	}
	return result;
}

function isNoteReferenceNode(
	node: unknown,
): node is NoteReferenceNode {
	return (
		typeof node === "object" &&
		node !== null &&
		(node as { type?: unknown }).type === "noteReference"
	);
}

/**
 * `@tanstack/markdown` extension adding support for `[[NOTE_ID]]` syntax,
 * rendering it as a clickable chip. Pairs with the `noteReference` Tiptap
 * node in `markdown-editor/note-reference-node.ts`, which handles the
 * authoring side (typing/inserting/serializing the same syntax).
 */
export function noteReferenceMarkdownExtension(): MarkdownExtension {
	return {
		name: "noteReference",
		transformInline: (nodes) => transformNodes(nodes),
		renderHtml: (node) => {
			if (!isNoteReferenceNode(node)) {
				return undefined;
			}
			const noteId = (node as unknown as NoteReferenceNode).noteId;
			return (
				`<button type="button" data-note-reference data-note-id="${noteId}" ` +
				`class="note-reference-chip inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ` +
				`border border-palm/30 bg-palm/10 text-palm align-middle no-underline hover:bg-palm/20 hover:border-palm/50 ` +
				`cursor-pointer transition-colors">🔗 Note #${noteId}</button>`
			);
		},
	};
}
