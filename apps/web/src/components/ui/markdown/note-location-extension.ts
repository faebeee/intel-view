import type { InlineNode, MarkdownExtension } from "@tanstack/markdown";
import { NOTE_LOCATION_PATTERN } from "#/lib/note-locations.ts";

/**
 * Custom inline node representing a `[[geo:LAT,LNG,LABEL]]` reference to a
 * pinned map location. Not part of `@tanstack/markdown`'s built-in
 * `InlineNode` union, so it's cast at the boundaries where it crosses
 * into/out of that closed union (see `transformInline`/`renderHtml` below).
 */
export type NoteLocationNode = {
	type: "noteLocation";
	lat: number;
	lng: number;
	label: string | null;
};

/**
 * Splits a single text run into alternating text/note-location nodes
 * wherever a `[[geo:LAT,LNG,LABEL]]` pattern is found. Returns the original
 * node (in a single-element array) unchanged when there's no match, so
 * callers can always splice the result in place of the original node.
 */
function splitTextNode(node: { type: "text"; value: string }): InlineNode[] {
	NOTE_LOCATION_PATTERN.lastIndex = 0;
	if (!NOTE_LOCATION_PATTERN.test(node.value)) {
		return [node];
	}
	NOTE_LOCATION_PATTERN.lastIndex = 0;

	const result: InlineNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null = NOTE_LOCATION_PATTERN.exec(node.value);
	while (match !== null) {
		if (match.index > lastIndex) {
			result.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
		}
		const label = match[3].trim().length > 0 ? match[3].trim() : null;
		const noteLocation: NoteLocationNode = {
			type: "noteLocation",
			lat: Number(match[1]),
			lng: Number(match[2]),
			label,
		};
		result.push(noteLocation as unknown as InlineNode);
		lastIndex = match.index + match[0].length;
		match = NOTE_LOCATION_PATTERN.exec(node.value);
	}
	if (lastIndex < node.value.length) {
		result.push({ type: "text", value: node.value.slice(lastIndex) });
	}
	return result;
}

/**
 * Recursively applies `[[geo:LAT,LNG,LABEL]]` detection to a list of inline
 * nodes, including the children of nodes that themselves wrap inline
 * content (strong/emphasis/strike/link).
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

function isNoteLocationNode(node: unknown): node is NoteLocationNode {
	return (
		typeof node === "object" &&
		node !== null &&
		(node as { type?: unknown }).type === "noteLocation"
	);
}

/** Escapes HTML-significant characters in user-supplied label text before interpolating it into rendered markup. */
function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

/**
 * `@tanstack/markdown` extension adding support for `[[geo:LAT,LNG,LABEL]]`
 * syntax, rendering it as a clickable chip. Pairs with the `noteLocation`
 * Tiptap node in `markdown-editor/note-location-node.ts`, which handles the
 * authoring side (inserting/serializing the same syntax via the map picker).
 */
export function noteLocationMarkdownExtension(): MarkdownExtension {
	return {
		name: "noteLocation",
		transformInline: (nodes) => transformNodes(nodes),
		renderHtml: (node) => {
			if (!isNoteLocationNode(node)) {
				return undefined;
			}
			const { lat, lng, label } = node as unknown as NoteLocationNode;
			const safeLabel = label ? escapeHtml(label) : null;
			const chipText = safeLabel ? `📍 ${safeLabel}` : `📍 ${lat}, ${lng}`;
			return (
				`<button type="button" data-note-location data-lat="${lat}" data-lng="${lng}" ` +
				`data-label="${safeLabel ?? ""}" ` +
				`class="note-location-chip inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ` +
				`border border-palm/30 bg-palm/10 text-palm align-middle no-underline hover:bg-palm/20 hover:border-palm/50 ` +
				`cursor-pointer transition-colors">${chipText}</button>`
			);
		},
	};
}
