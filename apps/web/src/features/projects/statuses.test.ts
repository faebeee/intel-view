import { describe, expect, it } from "vitest";
import { findStatus, PROJECT_STATUSES } from "./statuses.ts";

describe("PROJECT_STATUSES", () => {
	it("lists planned, ongoing and completed in order", () => {
		expect(PROJECT_STATUSES.map((s) => s.id)).toEqual([
			"planned",
			"ongoing",
			"completed",
		]);
	});

	it("maps every status to a status-chip colour token", () => {
		for (const status of PROJECT_STATUSES) {
			expect(status.token).toMatch(/^var\(--mc-[a-z-]+\)$/);
		}
	});
});

describe("findStatus", () => {
	it("resolves a status id to its definition", () => {
		expect(findStatus("ongoing").id).toBe("ongoing");
	});

	it("falls back to planned for unknown values", () => {
		expect(
			findStatus("retired" as (typeof PROJECT_STATUSES)[number]["id"]).id,
		).toBe("planned");
	});
});
