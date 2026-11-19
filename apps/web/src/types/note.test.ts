import { describe, expect, it } from "vitest";
import { BUILTIN_NOTE_TYPES, isSoftwareNoteType } from "./note.ts";

describe("isSoftwareNoteType", () => {
	it("treats every built-in type as not software", () => {
		for (const type of BUILTIN_NOTE_TYPES) {
			expect(isSoftwareNoteType(type)).toBe(false);
		}
	});

	it("treats custom service types as software", () => {
		expect(isSoftwareNoteType("ssh")).toBe(true);
		expect(isSoftwareNoteType("custom-proto")).toBe(true);
	});
});
