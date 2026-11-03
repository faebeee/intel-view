import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PhaseProgressBar } from "./PhaseProgressBar.tsx";

function phaseButtons(): HTMLElement[] {
	const list = screen.getByRole("list", { name: "Penetration test phases" });
	return within(list).getAllByRole("button");
}

describe("PhaseProgressBar", () => {
	it("renders all 9 phases in order as not started when there is no phase", () => {
		render(<PhaseProgressBar phase={null} onSelectPhase={vi.fn()} />);

		const buttons = phaseButtons();
		expect(buttons).toHaveLength(9);
		expect(buttons.map((b) => b.dataset.status)).toEqual(Array(9).fill("todo"));
		expect(buttons[0]).toHaveAccessibleName(
			"01 Planning & Scoping, not started",
		);
		expect(buttons[8]).toHaveAttribute("title", "Completed");
		expect(screen.getByText("0")).toHaveClass("text-mc-accent");
	});

	it("marks earlier phases done, the current one in progress and later ones todo", () => {
		render(<PhaseProgressBar phase="exploitation" onSelectPhase={vi.fn()} />);

		const buttons = phaseButtons();
		expect(buttons.map((b) => b.dataset.status)).toEqual([
			"done",
			"done",
			"done",
			"done",
			"current",
			"todo",
			"todo",
			"todo",
			"todo",
		]);
		expect(buttons[3]).toHaveAccessibleName(
			"04 Vulnerability Assessment, complete",
		);
		expect(buttons[4]).toHaveAccessibleName("05 Exploitation, in progress");
		expect(buttons[4]).toHaveAttribute("aria-current", "step");
		expect(buttons[3]).not.toHaveAttribute("aria-current");
		expect(screen.getByText("4")).toHaveClass("text-mc-accent");
	});

	it("styles each state's bar, label and meta", () => {
		render(<PhaseProgressBar phase="recon" onSelectPhase={vi.fn()} />);

		const [done, current, todo] = phaseButtons();
		const parts = (button: HTMLElement) => {
			const [bar, label] = Array.from(button.children) as HTMLElement[];
			return { bar, label, meta: label.lastElementChild as HTMLElement };
		};

		expect(parts(done).bar).toHaveClass("mc-phase-bar");
		expect(parts(done).bar.dataset.status).toBe("done");
		expect(parts(done).label).toHaveClass("text-mc-accent-hover");
		expect(parts(done).meta).toHaveTextContent("Done");
		expect(parts(done).meta).toHaveClass("text-mc-text-2");

		expect(parts(current).bar.dataset.status).toBe("current");
		expect(parts(current).label).toHaveClass("text-mc-text");
		expect(parts(current).meta).toHaveTextContent("Now");
		expect(parts(current).meta).toHaveClass("text-mc-accent");

		expect(parts(todo).bar.dataset.status).toBe("todo");
		expect(parts(todo).label).toHaveClass("text-mc-text-muted");
		expect(parts(todo).meta).toHaveTextContent("—");
	});

	it("sets the clicked phase as current, by mouse and keyboard", async () => {
		const user = userEvent.setup();
		const onSelectPhase = vi.fn();
		render(<PhaseProgressBar phase="recon" onSelectPhase={onSelectPhase} />);

		await user.click(phaseButtons()[5]);
		expect(onSelectPhase).toHaveBeenLastCalledWith("post_exploitation");

		phaseButtons()[0].focus();
		await user.keyboard("{Enter}");
		expect(onSelectPhase).toHaveBeenLastCalledWith("planning");

		await user.tab();
		await user.tab();
		await user.keyboard(" ");
		expect(onSelectPhase).toHaveBeenLastCalledWith("scanning");
	});

	it("does nothing when the current phase is clicked again or while disabled", async () => {
		const user = userEvent.setup();
		const onSelectPhase = vi.fn();
		const { rerender } = render(
			<PhaseProgressBar phase="recon" onSelectPhase={onSelectPhase} />,
		);

		await user.click(phaseButtons()[1]);
		expect(onSelectPhase).not.toHaveBeenCalled();

		rerender(
			<PhaseProgressBar phase="recon" onSelectPhase={onSelectPhase} disabled />,
		);
		await user.click(phaseButtons()[4]);
		expect(onSelectPhase).not.toHaveBeenCalled();
	});
});
