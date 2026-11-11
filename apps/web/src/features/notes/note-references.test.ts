import type { NoteResponseDto as Note } from "@repo/sdk";
import { describe, expect, it } from "vitest";
import { renderNotes, resolveNoteReferences } from "./note-references";

function note(partial: Partial<Note> & Pick<Note, "id">): Note {
	return {
		projectId: 1,
		type: "standard",
		title: "",
		content: "",
		tags: [],
		color: null,
		parentIds: [],
		childIds: [],
		canvasX: null,
		canvasY: null,
		fileName: null,
		fileMimeType: null,
		fileSize: null,
		createdAt: "",
		updatedAt: "",
		...partial,
	} as Note;
}

describe("resolveNoteReferences", () => {
	const notes = [
		note({ id: 1, type: "ip", title: "Target", content: "10.0.0.5" }),
		note({ id: 2, title: "Port", content: "Service on [[1]]:22\nsecond line" }),
		note({ id: 3, type: "log", title: "Recon log", content: "" }),
		note({ id: 4, type: "file", title: "Dump", fileName: "dump.pcap" }),
		note({ id: 5, title: "A", content: "[[6]]" }),
		note({ id: 6, title: "B", content: "[[5]]" }),
	];
	const byId = new Map(notes.map((n) => [n.id, n]));

	it("replaces a reference with the referenced note's content", () => {
		expect(resolveNoteReferences("Host [[1]]", byId)).toBe("Host 10.0.0.5");
	});

	it("accepts a # prefix and inner whitespace", () => {
		expect(resolveNoteReferences("[[ #1 ]]", byId)).toBe("10.0.0.5");
	});

	it("resolves nested references recursively", () => {
		expect(resolveNoteReferences("[[2]]", byId)).toBe(
			"Service on 10.0.0.5:22\nsecond line",
		);
	});

	it("collapses whitespace when rendering into a title", () => {
		expect(resolveNoteReferences("[[2]]", byId, "title")).toBe(
			"Service on 10.0.0.5:22 second line",
		);
	});

	it("falls back to the title for notes without content", () => {
		expect(resolveNoteReferences("[[3]]", byId)).toBe("Recon log");
	});

	it("uses the file name for file notes", () => {
		expect(resolveNoteReferences("[[4]]", byId)).toBe("dump.pcap");
	});

	it("leaves unknown references untouched", () => {
		expect(resolveNoteReferences("x [[99]] y", byId)).toBe("x [[99]] y");
	});

	it("stops at cycles instead of looping", () => {
		expect(resolveNoteReferences("[[5]]", byId)).toBe("[[5]]");
	});
});

describe("renderNotes", () => {
	it("renders titles and content but keeps unchanged notes identical", () => {
		const target = note({ id: 1, type: "ip", content: "10.0.0.5" });
		const ref = note({ id: 2, title: "Host [[1]]", content: "See **[[1]]**" });
		const [renderedTarget, renderedRef] = renderNotes([target, ref]);
		expect(renderedTarget).toBe(target);
		expect(renderedRef.title).toBe("Host 10.0.0.5");
		expect(renderedRef.content).toBe("See **10.0.0.5**");
		// The original stays untouched so editors keep the raw markup.
		expect(ref.title).toBe("Host [[1]]");
	});

	it("does not resolve a note's reference to itself", () => {
		const self = note({ id: 7, title: "Me [[7]]", content: "body" });
		expect(renderNotes([self])[0].title).toBe("Me [[7]]");
	});
});
