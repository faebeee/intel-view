import type { ProjectResponseDto } from "@repo/sdk";
import { Link } from "@tanstack/react-router";
import { ArrowRight, FolderKanban, Pencil, Trash2 } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { StatePanel } from "#/components/ui/loading-state.tsx";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import { StatusChip } from "#/features/common/components/StatusChip.tsx";
import { formatIsoDate } from "#/lib/format.ts";
import { readLastProjectId } from "#/lib/last-project.ts";
import {
	COLOR_THEME_LABELS,
	COLOR_THEME_TOKEN,
	COLOR_THEMES,
	type ColorTheme,
	DEFAULT_COLOR_THEME,
	isColorTheme,
} from "#/lib/theme.ts";
import { cn } from "#/lib/utils.ts";

type SortOrder = "newest" | "oldest" | "name";

const SORT_LABELS: Record<SortOrder, string> = {
	newest: "newest first",
	oldest: "oldest first",
	name: "name a–z",
};

const PAGE_SIZE = 25;

type ProjectTableProps = {
	projects: ProjectResponseDto[];
	emptyTitle?: string;
	emptyDescription?: string;
	onEdit: (project: ProjectResponseDto) => void;
	onDelete: (project: ProjectResponseDto) => void;
	isDeleting?: boolean;
};

function themeOf(project: ProjectResponseDto): ColorTheme {
	return isColorTheme(project.color) ? project.color : DEFAULT_COLOR_THEME;
}

const TH_CLASS =
	"border-b border-mc-border px-5 py-3 text-left font-mono text-[10.5px] font-medium tracking-[0.12em] text-mc-text-muted uppercase";
const TD_CLASS = "border-b border-mc-row-divider px-5";

/**
 * Filter bar + project table shared by every folder-detail route (a real
 * folder, or the synthetic "Ungrouped" folder). Filtering, the colour
 * ("status") filter, sorting and paging all happen client-side on the
 * already-loaded list. Scrolls horizontally under 860px.
 */
export function ProjectTable({
	projects,
	emptyTitle = "No projects yet",
	emptyDescription = "Create a project to start adding notes and tags.",
	onEdit,
	onDelete,
	isDeleting = false,
}: ProjectTableProps): JSX.Element {
	const [query, setQuery] = React.useState("");
	const [theme, setTheme] = React.useState<ColorTheme | "all">("all");
	const [sort, setSort] = React.useState<SortOrder>("newest");
	const [visible, setVisible] = React.useState(PAGE_SIZE);
	const filterId = React.useId();
	const sortId = React.useId();

	// Read after mount so the server render and hydration agree.
	const [lastProjectId, setLastProjectId] = React.useState<string | null>(null);
	React.useEffect(() => setLastProjectId(readLastProjectId()), []);

	const themeCounts = React.useMemo(() => {
		const counts = new Map<ColorTheme, number>();
		for (const project of projects) {
			const key = themeOf(project);
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return counts;
	}, [projects]);

	const rows = React.useMemo(() => {
		const needle = query.trim().toLowerCase();
		const filtered = projects.filter(
			(project) =>
				(theme === "all" || themeOf(project) === theme) &&
				(!needle ||
					project.name.toLowerCase().includes(needle) ||
					(project.description ?? "").toLowerCase().includes(needle)),
		);
		return filtered.sort((a, b) => {
			if (sort === "name") return a.name.localeCompare(b.name);
			const diff =
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			return sort === "oldest" ? diff : -diff || b.id - a.id;
		});
	}, [projects, query, theme, sort]);

	if (projects.length === 0) {
		return (
			<div className="max-w-[1320px] border border-mc-border bg-mc-panel">
				<StatePanel
					icon={<FolderKanban className="size-6" strokeWidth={1.6} />}
					title={emptyTitle}
					description={emptyDescription}
				/>
			</div>
		);
	}

	const shown = rows.slice(0, visible);

	return (
		<div className="flex max-w-[1320px] flex-col">
			<div className="flex flex-wrap items-center gap-3 border border-mc-border bg-mc-panel p-3">
				<label
					htmlFor={filterId}
					className="mc-input-focus flex h-[38px] max-w-[380px] flex-[1_1_260px] items-center gap-2 border border-mc-border-strong bg-mc-bg px-3 font-mono text-[12.5px] text-mc-text-muted"
				>
					<span aria-hidden="true" className="text-mc-accent">
						›
					</span>
					<span className="sr-only">Filter projects</span>
					<input
						id={filterId}
						type="search"
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setVisible(PAGE_SIZE);
						}}
						placeholder="filter projects"
						className="min-w-0 flex-1 border-0 bg-transparent text-mc-text outline-none placeholder:text-mc-text-muted"
					/>
				</label>

				{/* biome-ignore lint/a11y/useSemanticElements: a toggle-button group, not a form fieldset */}
				<div
					role="group"
					aria-label="Status"
					className="flex flex-wrap border border-mc-border-strong"
				>
					<FilterToggle
						pressed={theme === "all"}
						onClick={() => setTheme("all")}
					>
						All <span className="text-mc-text-2">{projects.length}</span>
					</FilterToggle>
					{COLOR_THEMES.filter((key) => themeCounts.has(key)).map((key) => (
						<FilterToggle
							key={key}
							pressed={theme === key}
							onClick={() => setTheme(key)}
						>
							<span
								aria-hidden="true"
								className="size-1.5"
								style={{ backgroundColor: COLOR_THEME_TOKEN[key] }}
							/>
							{COLOR_THEME_LABELS[key]}
						</FilterToggle>
					))}
				</div>

				<div className="flex-1" />

				<label
					htmlFor={sortId}
					className="flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-mc-text-muted uppercase"
				>
					Sort
					<select
						id={sortId}
						value={sort}
						onChange={(event) => setSort(event.target.value as SortOrder)}
						className="h-9 border border-mc-border-strong bg-mc-bg px-2 font-mono text-xs tracking-normal text-mc-text normal-case focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
					>
						{(Object.keys(SORT_LABELS) as SortOrder[]).map((key) => (
							<option key={key} value={key}>
								{SORT_LABELS[key]}
							</option>
						))}
					</select>
				</label>
			</div>

			<div className="overflow-x-auto border border-t-0 border-mc-border bg-mc-panel">
				<table className="w-full min-w-[860px] border-collapse">
					<thead>
						<tr>
							<th scope="col" className={cn(TH_CLASS, "w-16")}>
								ID
							</th>
							<th scope="col" className={TH_CLASS}>
								Project
							</th>
							<th scope="col" className={TH_CLASS}>
								Description
							</th>
							<th scope="col" className={TH_CLASS}>
								Status
							</th>
							<th scope="col" className={TH_CLASS}>
								Created
							</th>
							<th scope="col" className={TH_CLASS}>
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody>
						{shown.map((project) => {
							const key = themeOf(project);
							const isLast = String(project.id) === lastProjectId;
							const params = { projectId: String(project.id) };
							return (
								<tr
									key={project.id}
									className={cn(
										"transition-colors hover:bg-mc-panel-hover",
										isLast && "bg-mc-accent/4",
									)}
								>
									<td
										className={cn(
											TD_CLASS,
											"h-[62px] font-mono text-[11px] text-mc-text-muted",
											isLast && "shadow-[inset_2px_0_0_var(--mc-accent)]",
										)}
									>
										#{project.id}
									</td>
									<td className={TD_CLASS}>
										<Link
											to="/projects/$projectId"
											params={params}
											className="font-display text-[17px] font-semibold tracking-[0.02em] text-mc-text no-underline uppercase hover:text-mc-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
										>
											{project.name}
										</Link>
									</td>
									<td
										className={cn(
											TD_CLASS,
											"max-w-[380px] truncate font-mono text-xs",
											project.description
												? "text-mc-text-2"
												: "text-mc-text-muted",
										)}
										title={project.description ?? undefined}
									>
										{project.description || "—"}
									</td>
									<td className={TD_CLASS}>
										<StatusChip color={COLOR_THEME_TOKEN[key]}>
											{COLOR_THEME_LABELS[key]}
										</StatusChip>
									</td>
									<td
										className={cn(
											TD_CLASS,
											"font-mono text-xs whitespace-nowrap text-mc-text-2",
										)}
									>
										{formatIsoDate(project.createdAt)}
									</td>
									<td className={cn(TD_CLASS, "pr-3")}>
										<div className="flex items-center justify-end gap-0.5">
											<McButton
												variant="link"
												size="sm"
												className="px-3 text-[11.5px]"
												asChild
											>
												<Link
													to="/projects/$projectId"
													params={params}
													aria-label={`Open project ${project.name}`}
												>
													Open
													<ArrowRight className="size-3.5" />
												</Link>
											</McButton>
											<McButton
												variant="ghost"
												size="icon"
												aria-label={`Edit project ${project.name}`}
												title="Edit project"
												onClick={() => onEdit(project)}
											>
												<Pencil className="size-[15px]" strokeWidth={1.75} />
											</McButton>
											<ConfirmationButton
												onClick={() => onDelete(project)}
												title={`Delete project "${project.name}"?`}
												description="All of its notes are deleted too. This can't be undone."
												confirmText="Delete project"
												trigger={
													<McButton
														variant="ghost"
														size="icon"
														aria-label={`Delete project ${project.name}`}
														title="Delete project"
														disabled={isDeleting}
														className="hover:text-mc-danger-text"
													>
														<Trash2
															className="size-[15px]"
															strokeWidth={1.75}
														/>
													</McButton>
												}
											/>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{rows.length === 0 && (
					<p className="m-0 px-5 py-10 text-center font-mono text-xs tracking-[0.1em] text-mc-text-muted uppercase">
						No projects match the filter
					</p>
				)}

				<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 font-mono text-[11px] tracking-[0.1em] text-mc-text-muted uppercase">
					<span>
						Showing {shown.length} / {rows.length}
					</span>
					{rows.length > shown.length && (
						<McButton
							variant="secondary"
							size="sm"
							className="bg-transparent font-mono text-[11px] tracking-[0.1em] uppercase"
							onClick={() => setVisible((current) => current + PAGE_SIZE)}
						>
							Load more
						</McButton>
					)}
				</div>
			</div>
		</div>
	);
}

function FilterToggle({
	pressed,
	onClick,
	children,
}: {
	pressed: boolean;
	onClick: () => void;
	children: React.ReactNode;
}): JSX.Element {
	return (
		<button
			type="button"
			aria-pressed={pressed}
			onClick={onClick}
			className={cn(
				"flex h-9 cursor-pointer items-center gap-2 border-0 px-3.5 font-mono text-[11px] tracking-[0.1em] uppercase transition-colors not-first:border-l not-first:border-mc-border-strong focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-mc-accent",
				pressed
					? "bg-mc-accent/12 text-mc-accent-hover"
					: "bg-transparent text-mc-text-2 hover:text-mc-text",
			)}
		>
			{children}
		</button>
	);
}
