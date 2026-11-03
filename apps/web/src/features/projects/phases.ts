import type { ProjectResponseDto } from "@repo/sdk";
import { m } from "#/paraglide/messages.js";

export type ProjectPhase = NonNullable<ProjectResponseDto["phase"]>;

/** Derived from the project's current phase: earlier phases are done, later ones not started. */
export type PhaseStatus = "done" | "current" | "todo";

export type PhaseDefinition = {
	id: ProjectPhase;
	/** Caps label shown on the progress bar. */
	short: () => string;
	/** Full name for the tooltip and screen readers. */
	name: () => string;
};

/** The penetration-test phases in engagement order (mirrors the API's `PROJECT_PHASES`). */
export const PROJECT_PHASES: PhaseDefinition[] = [
	{
		id: "planning",
		short: m.phase_planning_short,
		name: m.phase_planning_name,
	},
	{ id: "recon", short: m.phase_recon_short, name: m.phase_recon_name },
	{
		id: "scanning",
		short: m.phase_scanning_short,
		name: m.phase_scanning_name,
	},
	{
		id: "vuln_assessment",
		short: m.phase_vuln_assessment_short,
		name: m.phase_vuln_assessment_name,
	},
	{
		id: "exploitation",
		short: m.phase_exploitation_short,
		name: m.phase_exploitation_name,
	},
	{
		id: "post_exploitation",
		short: m.phase_post_exploitation_short,
		name: m.phase_post_exploitation_name,
	},
	{ id: "cleanup", short: m.phase_cleanup_short, name: m.phase_cleanup_name },
	{
		id: "reporting",
		short: m.phase_reporting_short,
		name: m.phase_reporting_name,
	},
	{
		id: "completed",
		short: m.phase_completed_short,
		name: m.phase_completed_name,
	},
];

/**
 * Design token (CSS variable) each phase's status chip is tinted with. The
 * engagement walks from neutral prep work through the "hot" offensive phases
 * and back to the accent colour as it wraps up.
 */
export const PHASE_TOKEN: Record<ProjectPhase, string> = {
	planning: "var(--mc-text-muted)",
	recon: "var(--mc-data)",
	scanning: "var(--mc-data)",
	vuln_assessment: "var(--mc-warning)",
	exploitation: "var(--mc-danger)",
	post_exploitation: "var(--mc-danger)",
	cleanup: "var(--mc-service)",
	reporting: "var(--mc-accent)",
	completed: "var(--mc-accent)",
};

/** Token used when a project has no phase yet (the engagement hasn't started). */
export const NO_PHASE_TOKEN = "var(--mc-border-strong)";

export function findPhase(phase: ProjectPhase): PhaseDefinition | undefined {
	return PROJECT_PHASES.find((definition) => definition.id === phase);
}

export function phaseStatus(
	phase: ProjectPhase,
	current: ProjectPhase | null,
): PhaseStatus {
	if (current === null) return "todo";
	const index = PROJECT_PHASES.findIndex((p) => p.id === phase);
	const currentIndex = PROJECT_PHASES.findIndex((p) => p.id === current);
	if (index < currentIndex) return "done";
	return index === currentIndex ? "current" : "todo";
}
