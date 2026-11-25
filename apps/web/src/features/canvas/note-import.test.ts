import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseNoteImport } from "./note-import.ts";

function doc(notes: unknown, extra: Record<string, unknown> = {}): string {
	return JSON.stringify({
		format: "intel-view/notes",
		version: 1,
		notes,
		...extra,
	});
}

function ok(text: string) {
	const result = parseNoteImport(text);
	if (result.kind !== "ok") {
		throw new Error(`expected ok, got ${JSON.stringify(result)}`);
	}
	return result.plan;
}

function errors(text: string): string[] {
	const result = parseNoteImport(text);
	if (result.kind !== "error") {
		throw new Error(`expected error, got ${result.kind}`);
	}
	return result.errors;
}

describe("parseNoteImport", () => {
	it("ignores text that isn't a notes document", () => {
		expect(parseNoteImport("hello").kind).toBe("not-import");
		expect(parseNoteImport("{ broken").kind).toBe("not-import");
		expect(parseNoteImport('{"notes": []}').kind).toBe("not-import");
		expect(parseNoteImport("[1,2]").kind).toBe("not-import");
	});

	it("rejects unsupported versions", () => {
		expect(errors(doc([{ title: "a" }], { version: 2 }))[0]).toMatch(
			/Unsupported version/,
		);
	});

	it("defaults the type to standard and passes fields through", () => {
		const plan = ok(
			doc(
				[
					{
						title: "Host",
						content: "body",
						tags: ["recon"],
						color: "#00f2ff",
					},
				],
				{ source: "nmap-export" },
			),
		);
		expect(plan.source).toBe("nmap-export");
		expect(plan.notes).toHaveLength(1);
		expect(plan.notes[0]).toMatchObject({
			type: "standard",
			title: "Host",
			content: "body",
			tags: ["recon"],
			color: "#00f2ff",
			parentKeys: [],
			existingParentIds: [],
			offset: { x: 0, y: 0 },
		});
	});

	it("flattens nested children, parents before children", () => {
		const plan = ok(
			doc([
				{
					ref: "host",
					type: "ip",
					content: "10.0.0.5",
					children: [
						{ ref: "ssh", type: "ssh", version: "OpenSSH 8.9p1" },
						{ type: "http", children: [{ type: "url", content: "http://x" }] },
					],
				},
			]),
		);
		expect(plan.notes.map((n) => n.type)).toEqual(["ip", "ssh", "http", "url"]);
		expect(plan.notes[1]?.parentKeys).toEqual(["host"]);
		expect(plan.notes[3]?.parentKeys).toEqual([plan.notes[2]?.key]);
		expect(plan.notes[3]?.offset.x).toBeGreaterThan(
			plan.notes[2]?.offset.x ?? 0,
		);
	});

	it("orders notes by parent refs regardless of document order", () => {
		const plan = ok(
			doc([
				{ ref: "child", parents: ["a", "b"] },
				{ ref: "a" },
				{ ref: "b", parents: ["a"] },
			]),
		);
		expect(plan.notes.map((n) => n.key)).toEqual(["a", "b", "child"]);
		expect(plan.notes[2]?.parentKeys).toEqual(["a", "b"]);
	});

	it("separates numeric parents as existing note IDs", () => {
		const plan = ok(doc([{ title: "x", parents: [42] }]));
		expect(plan.notes[0]?.existingParentIds).toEqual([42]);
		expect(plan.notes[0]?.parentKeys).toEqual([]);
	});

	it("collects validation errors", () => {
		const errs = errors(
			doc([
				{ ref: "a", type: "Bad Type" },
				{ ref: "a" },
				{ type: "file" },
				{ type: "standard", version: "1.0" },
				{ type: "standard", entries: ["x"] },
				{ color: "red", parents: ["missing"], extra: true },
			]),
		);
		expect(errs.join("\n")).toMatch(/not a lowercase slug/);
		expect(errs.join("\n")).toMatch(/duplicate ref "a"/);
		expect(errs.join("\n")).toMatch(/"file" notes can't be imported/);
		expect(errs.join("\n")).toMatch(/version: only allowed/);
		expect(errs.join("\n")).toMatch(/entries: only allowed/);
		expect(errs.join("\n")).toMatch(/color: must be a hex/);
		expect(errs.join("\n")).toMatch(/unknown ref "missing"/);
		expect(errs.join("\n")).toMatch(/unknown field "extra"/);
	});

	it("detects cycles", () => {
		expect(
			errors(
				doc([
					{ ref: "a", parents: ["b"] },
					{ ref: "b", parents: ["a"] },
				]),
			)[0],
		).toMatch(/cycle/);
	});

	it("accepts log entries on log notes", () => {
		const plan = ok(doc([{ type: "log", entries: ["one", "two"] }]));
		expect(plan.notes[0]?.entries).toEqual(["one", "two"]);
	});

	it("requires a non-empty notes array", () => {
		expect(errors(doc([]))[0]).toMatch(/non-empty array/);
	});

	it("parses the example in docs/note-import-format.md", () => {
		const markdown = readFileSync(
			resolve(process.cwd(), "../../docs/note-import-format.md"),
			"utf8",
		);
		const example = /```json\n([\s\S]*?)```/.exec(markdown)?.[1];
		expect(example).toBeDefined();
		const plan = ok(example ?? "");
		expect(plan.notes).toHaveLength(5);
		const log = plan.notes.find((n) => n.type === "log");
		expect(log?.parentKeys).toEqual(["host"]);
		expect(log?.existingParentIds).toEqual([17]);
		expect(log?.entries).toHaveLength(2);
	});
});
