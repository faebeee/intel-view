import type { JSX } from "react";
import {
	type PhaseStatus,
	PROJECT_PHASES,
	type ProjectPhase,
	phaseStatus,
} from "#/features/projects/phases.ts";
import { cn } from "#/lib/utils.ts";
import { m } from "#/paraglide/messages.js";

type PhaseProgressBarProps = {
	/** The project's current phase; null when the engagement hasn't started. */
	phase: ProjectPhase | null;
	/** Called with the clicked phase, which becomes the project's current phase. */
	onSelectPhase: (phase: ProjectPhase) => void;
	disabled?: boolean;
	className?: string;
};

const LABEL_COLOR: Record<PhaseStatus, string> = {
	done: "text-mc-accent-hover",
	current: "text-mc-text",
	todo: "text-mc-text-muted",
};

const STATUS_TEXT: Record<PhaseStatus, () => string> = {
	done: m.phase_status_done,
	current: m.phase_status_current,
	todo: m.phase_status_todo,
};

/**
 * Engagement progress for a pentest project (canvas header, second row):
 * an "n / 8 phases" summary and one segment per phase. Clicking a segment
 * makes it the project's current phase.
 */
export function PhaseProgressBar({
	phase,
	onSelectPhase,
	disabled,
	className,
}: PhaseProgressBarProps): JSX.Element {
	const statuses = PROJECT_PHASES.map((p) => phaseStatus(p.id, phase));
	const doneCount = statuses.filter((status) => status === "done").length;

	return (
		<div className={cn("flex flex-wrap items-center gap-5", className)}>
			<div className="flex min-w-[150px] flex-col gap-0.5">
				<span className="font-mono text-[10.5px] tracking-[0.12em] text-mc-text-muted uppercase">
					{m.phase_engagement()}
				</span>
				<span className="font-display text-lg font-semibold tracking-[0.04em] uppercase">
					<span className="text-mc-accent">{doneCount}</span>{" "}
					{m.phase_progress_total({ total: PROJECT_PHASES.length })}
				</span>
			</div>
			<ol
				aria-label={m.phase_bar_label()}
				className="m-0 grid min-w-0 flex-[1_1_760px] list-none grid-cols-8 gap-1.5 p-0 max-[900px]:grid-cols-4"
			>
				{PROJECT_PHASES.map((definition, index) => {
					const status = statuses[index];
					const number = String(index + 1).padStart(2, "0");
					const name = definition.name();
					return (
						<li key={definition.id} className="min-w-0">
							<button
								type="button"
								data-status={status}
								aria-current={status === "current" ? "step" : undefined}
								aria-label={m.phase_item_label({
									number,
									name,
									status: STATUS_TEXT[status](),
								})}
								title={name}
								disabled={disabled}
								onClick={() => {
									if (status !== "current") onSelectPhase(definition.id);
								}}
								className="flex min-h-11 w-full cursor-pointer flex-col justify-center gap-2 border-0 bg-transparent px-0 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent disabled:cursor-default"
							>
								<span
									aria-hidden="true"
									className="mc-phase-bar h-1 w-full"
									data-status={status}
								/>
								<span
									aria-hidden="true"
									className={cn(
										"flex w-full min-w-0 items-baseline gap-1.5 font-mono text-[10.5px] tracking-[0.1em] uppercase",
										LABEL_COLOR[status],
									)}
								>
									<span className="opacity-70">{number}</span>
									<span className="min-w-0 flex-1 truncate font-semibold">
										{definition.short()}
									</span>
									<span
										className={cn(
											"shrink-0",
											status === "current"
												? "text-mc-accent"
												: "text-mc-text-2",
										)}
									>
										{status === "done"
											? m.phase_meta_done()
											: status === "current"
												? m.phase_meta_now()
												: "—"}
									</span>
								</span>
							</button>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
