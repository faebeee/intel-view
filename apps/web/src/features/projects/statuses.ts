import type { ProjectResponseDto } from "@repo/sdk";
import { m } from "#/paraglide/messages.js";

export type ProjectStatus = ProjectResponseDto["status"];

export type StatusDefinition = {
	id: ProjectStatus;
	/** Localized label. */
	label: () => string;
	/** Design token (CSS variable) the status chip is tinted with. */
	token: string;
};

/** Project lifecycle statuses in order (mirrors the API's `PROJECT_STATUSES`). */
export const PROJECT_STATUSES: StatusDefinition[] = [
	{ id: "planned", label: m.status_planned, token: "var(--mc-text-muted)" },
	{ id: "ongoing", label: m.status_ongoing, token: "var(--mc-data)" },
	{ id: "completed", label: m.status_completed, token: "var(--mc-accent)" },
];

export const DEFAULT_PROJECT_STATUS: ProjectStatus = "planned";

/** Definition for `status`, falling back to the default for unknown values. */
export function findStatus(status: ProjectStatus): StatusDefinition {
	return (
		PROJECT_STATUSES.find((definition) => definition.id === status) ??
		PROJECT_STATUSES[0]
	);
}
