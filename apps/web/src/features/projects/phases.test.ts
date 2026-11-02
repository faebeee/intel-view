import { describe, expect, it } from "vitest";
import {
	findPhase,
	PHASE_TOKEN,
	PROJECT_PHASES,
	phaseStatus,
} from "./phases.ts";

describe("phaseStatus", () => {
	it("treats every phase as todo before the engagement starts", () => {
		expect(PROJECT_PHASES.map((p) => phaseStatus(p.id, null))).toEqual(
			Array(8).fill("todo"),
		);
	});

	it("derives done / current / todo from the project's current phase", () => {
		expect(phaseStatus("planning", "scanning")).toBe("done");
		expect(phaseStatus("scanning", "scanning")).toBe("current");
		expect(phaseStatus("reporting", "scanning")).toBe("todo");
	});
});

describe("findPhase", () => {
	it("resolves a phase id to its definition", () => {
		expect(findPhase("recon")?.id).toBe("recon");
	});

	it("returns undefined for an id the UI doesn't know", () => {
		expect(
			findPhase("retired" as (typeof PROJECT_PHASES)[number]["id"]),
		).toBeUndefined();
	});
});

describe("PHASE_TOKEN", () => {
	it("maps every phase to a status-chip colour token", () => {
		for (const phase of PROJECT_PHASES) {
			expect(PHASE_TOKEN[phase.id]).toMatch(/^var\(--mc-[a-z-]+\)$/);
		}
	});
});
