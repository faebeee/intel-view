import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Calendar,
	Clock3,
	FileText,
	LayoutDashboard,
	MapPin,
	NotebookPen,
	Pin,
	StickyNote,
	Tag as TagIcon,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { JSX } from "react";
import * as React from "react";
import { TagChip } from "#/components/ui/tag-chip.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#/components/ui/card.tsx";
import { LoadingState, NotFoundState } from "#/components/ui/loading-state.tsx";
import { useAllNoteLocationsQuery } from "#/features/notes/hooks/useAllNoteLocationsQuery.ts";
import { useAllNotesQuery } from "#/features/notes/hooks/useAllNotesQuery.ts";
import { ProjectColorBadge } from "#/features/projects/components/ProjectColorBadge.tsx";
import { useProjectQuery } from "#/features/projects/hooks/useProjectQuery.ts";
import { useAllTagsQuery } from "#/features/tags/hooks/useAllTagsQuery.ts";

type DashboardMetric = {
	label: string;
	value: string;
	description: string;
	icon: LucideIcon;
};

type NoteTypeKey = "standard" | "log" | "address" | "file";

const NOTE_TYPE_LABELS: Record<NoteTypeKey, string> = {
	standard: "Standard",
	log: "Log",
	address: "Address",
	file: "File",
};

const NOTE_TYPE_ORDER: NoteTypeKey[] = ["standard", "log", "address", "file"];

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDashboardComponent,
});

function ProjectDashboardComponent(): JSX.Element {
	const { projectId } = Route.useParams();
	const id = parseInt(projectId, 10);
	const { data: project, isLoading } = useProjectQuery(id);
	const { data: notes = [], isLoading: isNotesLoading } = useAllNotesQuery(id);
	const { data: tags = [], isLoading: isTagsLoading } = useAllTagsQuery(id);
	const { data: locations = [], isLoading: isLocationsLoading } =
		useAllNoteLocationsQuery(id);

	if (isLoading) {
		return <LoadingState label="Loading project..." />;
	}

	if (!project) {
		return (
			<NotFoundState
				message={`Project #${projectId} not found.`}
				backTo="/"
				backLabel="Back to Projects"
			/>
		);
	}

	const dashboardMetrics = buildDashboardMetrics({ notes, tags, locations });
	const noteTypeStats = buildNoteTypeStats(notes);
	const recentNotes = [...notes].sort(
		(left, right) =>
			new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
	);
	const recentLocations = [...locations].sort(
		(left, right) =>
			new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
	);
	const tagUsage = buildTagUsage(notes);
	const canvasPlacedNotes = notes.filter(
		(note) => note.canvasX !== null && note.canvasY !== null,
	);
	const connectedNotes = notes.filter(
		(note) => note.parentIds.length > 0 || note.childIds.length > 0,
	);
	const recentlyTouchedNotes = notes.filter(
		(note) =>
			Date.now() - new Date(note.updatedAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
	);
	const emptyState = notes.length === 0;

	return (
		<div className="min-h-full w-full bg-background/50 p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-fade-in">
			<div className="flex flex-col gap-6 border-b border-line pb-6">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div className="flex flex-col gap-3 max-w-3xl">
						<div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground font-mono">
							<LayoutDashboard className="h-4 w-4 text-palm" />
							<span>Project Overview</span>
						</div>
						<div className="flex flex-col gap-2">
							<h1 className="text-2xl sm:text-3xl font-bold text-sea-ink uppercase tracking-wider font-mono">
								{project.name}
							</h1>
							<p className="text-sm text-muted-foreground max-w-2xl">
								{project.description ||
									"This project does not have a description yet."}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
							<ProjectColorBadge
								color={project.color}
								className="px-3 py-1 text-xs"
							/>
							{project.group ? (
								<span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-mono text-sea-ink">
									<span
										className="size-2 rounded-full"
										style={{ backgroundColor: project.group.color }}
									/>
									{project.group.name}
								</span>
							) : (
								<span className="inline-flex items-center gap-2 rounded-full border border-dashed border-line/70 bg-surface/40 px-3 py-1 text-xs font-mono text-muted-foreground">
									<Users className="h-3 w-3" />
									No group assigned
								</span>
							)}
							<span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-mono text-sea-ink">
								<Calendar className="h-3 w-3 text-palm" />
								Created {formatDate(project.createdAt)}
							</span>
							<span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-mono text-sea-ink">
								<Clock3 className="h-3 w-3 text-palm" />
								Updated {formatDate(project.updatedAt)}
							</span>
							<span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-mono text-sea-ink">
								<TagIcon className="h-3 w-3 text-palm" />
								{project.tags.length} project tag
								{project.tags.length === 1 ? "" : "s"}
							</span>
						</div>
						{project.tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 pt-1">
								{project.tags.map((tag) => (
									<TagChip
										key={tag.id}
										tag={tag.name}
										color={tag.color}
										size="sm"
									/>
								))}
							</div>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						<DashboardLink to="/projects/$projectId/notes" projectId={projectId}>
							<StickyNote className="h-4 w-4" />
							<span>Open Notes</span>
						</DashboardLink>
						<DashboardLink to="/projects/$projectId/tags" projectId={projectId}>
							<TagIcon className="h-4 w-4" />
							<span>Open Tags</span>
						</DashboardLink>
						<DashboardLink to="/projects/$projectId/map" projectId={projectId}>
							<MapPin className="h-4 w-4" />
							<span>Open Map</span>
						</DashboardLink>
						<DashboardLink to="/projects/$projectId/canvas" projectId={projectId}>
							<NotebookPen className="h-4 w-4" />
							<span>Open Canvas</span>
						</DashboardLink>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{dashboardMetrics.map((metric) => {
						const Icon = metric.icon;
						return (
							<Card
								key={metric.label}
								className="border-line bg-surface-strong/80 backdrop-blur-md"
							>
								<CardHeader className="pb-2">
									<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
										<Icon className="h-4 w-4 text-palm" />
										{metric.label}
									</CardDescription>
									<CardTitle className="text-2xl font-bold text-sea-ink font-mono">
										{metric.value}
									</CardTitle>
								</CardHeader>
								<CardContent className="pt-0">
									<p className="text-xs text-muted-foreground">
										{metric.description}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="border-line bg-surface-strong/80 backdrop-blur-md xl:col-span-2">
					<CardHeader>
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
							<StickyNote className="h-4 w-4 text-palm" />
							Notes at a glance
						</CardDescription>
						<CardTitle className="text-base font-bold uppercase tracking-wider text-sea-ink">
							Recent notes
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{isNotesLoading ? (
							<p className="text-sm text-muted-foreground">Loading notes...</p>
						) : emptyState ? (
							<div className="rounded-lg border border-dashed border-line bg-surface/50 p-6 text-sm text-muted-foreground">
								No notes yet. Create a note to populate the dashboard.
							</div>
						) : (
							recentNotes.slice(0, 6).map((note) => (
								<div
									key={note.id}
									className="flex flex-col gap-3 rounded-lg border border-line/70 bg-surface/60 p-4 md:flex-row md:items-start md:justify-between"
								>
									<div className="space-y-1.5">
										<div className="flex flex-wrap items-center gap-2">
											<NoteTypePill type={note.type} />
											<h3 className="text-sm font-bold text-sea-ink">
												{note.title || "Untitled note"}
											</h3>
										</div>
										<p className="max-w-2xl text-xs text-muted-foreground line-clamp-2">
											{note.content?.trim() || "No content yet."}
										</p>
										<div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
											<span>Updated {formatDate(note.updatedAt)}</span>
											<span>•</span>
											<span>{note.tags.length} tag{note.tags.length === 1 ? "" : "s"}</span>
											<span>•</span>
											<span>{note.parentIds.length} parent{note.parentIds.length === 1 ? "" : "s"}</span>
											<span>•</span>
											<span>{note.childIds.length} child{note.childIds.length === 1 ? "" : "ren"}</span>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										{note.canvasX !== null && note.canvasY !== null ? (
											<span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-sea-ink">
												<NotebookPen className="h-3 w-3 text-palm" />
												Canvas placed
											</span>
										) : null}
										{note.latitude !== null && note.longitude !== null ? (
											<span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-sea-ink">
												<Pin className="h-3 w-3 text-palm" />
												Has location
											</span>
										) : null}
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="border-line bg-surface-strong/80 backdrop-blur-md">
					<CardHeader>
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
							<FileText className="h-4 w-4 text-palm" />
							Project composition
						</CardDescription>
						<CardTitle className="text-base font-bold uppercase tracking-wider text-sea-ink">
							Breakdown
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="space-y-3">
							{noteTypeStats.map((stat) => (
								<div key={stat.type} className="space-y-1.5">
									<div className="flex items-center justify-between gap-3 text-xs">
										<span className="font-mono uppercase tracking-wider text-sea-ink">
											{stat.label}
										</span>
										<span className="font-mono text-muted-foreground">
											{stat.count} ({stat.percent}%)
										</span>
									</div>
									<div className="h-2 w-full overflow-hidden rounded-full bg-line/40">
										<div
											className="h-full rounded-full bg-palm"
											style={{ width: `${stat.percent}%` }}
										/>
									</div>
								</div>
							))}
						</div>

						<div className="grid grid-cols-2 gap-3 text-xs">
							<SmallStat label="Connected" value={connectedNotes.length} />
							<SmallStat label="Canvas" value={canvasPlacedNotes.length} />
							<SmallStat label="Tagged" value={notes.filter((note) => note.tags.length > 0).length} />
							<SmallStat label="Recent" value={recentlyTouchedNotes.length} />
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
				<Card className="border-line bg-surface-strong/80 backdrop-blur-md">
					<CardHeader>
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
							<TagIcon className="h-4 w-4 text-palm" />
							Tag usage
						</CardDescription>
						<CardTitle className="text-base font-bold uppercase tracking-wider text-sea-ink">
							Most used tags
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isTagsLoading ? (
							<p className="text-sm text-muted-foreground">Loading tags...</p>
						) : tagUsage.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No note tags are in use yet.
							</p>
						) : (
							tagUsage.slice(0, 8).map((tag) => (
								<div
									key={tag.name}
									className="flex items-center justify-between gap-4 rounded-lg border border-line/70 bg-surface/60 px-3 py-2"
								>
									<div className="flex items-center gap-2 min-w-0">
										<TagChip tag={tag.name} color={tag.color} size="sm" />
										<span className="text-xs text-muted-foreground truncate">
											Used by {tag.count} note{tag.count === 1 ? "" : "s"}
										</span>
									</div>
									<span className="text-xs font-mono text-sea-ink">{tag.count}</span>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card className="border-line bg-surface-strong/80 backdrop-blur-md">
					<CardHeader>
						<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
							<MapPin className="h-4 w-4 text-palm" />
							Location feed
						</CardDescription>
						<CardTitle className="text-base font-bold uppercase tracking-wider text-sea-ink">
							Recent pins
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						{isLocationsLoading ? (
							<p className="text-sm text-muted-foreground">
								Loading locations...
							</p>
						) : recentLocations.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No geographic pins have been created yet.
							</p>
						) : (
							recentLocations.slice(0, 6).map((location) => (
								<div
									key={location.id}
									className="rounded-lg border border-line/70 bg-surface/60 p-3"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="space-y-1">
											<p className="text-sm font-medium text-sea-ink">
												{location.noteLabel}
											</p>
											<p className="text-xs text-muted-foreground">
												{location.label || "Unnamed location"}
											</p>
										</div>
										<span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-sea-ink">
											<MapPin className="h-3 w-3 text-palm" />
											{formatCoordinates(location.lat, location.lng)}
										</span>
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function DashboardLink({
	children,
	projectId,
	to,
}: {
	children: React.ReactNode;
	projectId: string;
	to:
		| "/projects/$projectId/notes"
		| "/projects/$projectId/tags"
		| "/projects/$projectId/map"
		| "/projects/$projectId/canvas";
}): JSX.Element {
	return (
		<Link
			to={to}
			params={{ projectId }}
			className="inline-flex items-center gap-2 rounded-md border border-line bg-surface-strong/80 px-3 py-2 text-xs font-bold uppercase tracking-wider text-sea-ink no-underline transition-colors hover:border-palm/40 hover:text-palm"
		>
			{children}
		</Link>
	);
}

function NoteTypePill({ type }: { type: string }): JSX.Element {
	const label = NOTE_TYPE_LABELS[type as NoteTypeKey] ?? type;
	return (
		<span className="inline-flex items-center rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sea-ink">
			{label}
		</span>
	);
}

function SmallStat({ label, value }: { label: string; value: number }): JSX.Element {
	return (
		<div className="rounded-lg border border-line/70 bg-surface/60 px-3 py-2">
			<p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
				{label}
			</p>
			<p className="text-lg font-bold font-mono text-sea-ink">{value}</p>
		</div>
	);
}

function buildDashboardMetrics({
	notes,
	tags,
	locations,
}: {
	notes: { canvasX: number | null; canvasY: number | null }[];
	tags: unknown[];
	locations: unknown[];
}): DashboardMetric[] {
	const notesWithCanvas = notes.filter(
		(note) => note.canvasX !== null && note.canvasY !== null,
	).length;
	return [
		{
			label: "Notes",
			value: String(notes.length),
			description: "All active notes currently in this project.",
			icon: StickyNote,
		},
		{
			label: "Tags",
			value: String(tags.length),
			description: "Project tags available for classification.",
			icon: TagIcon,
		},
		{
			label: "Pins",
			value: String(locations.length),
			description: "Geographic pins resolved from note content.",
			icon: MapPin,
		},
		{
			label: "Canvas Notes",
			value: String(notesWithCanvas),
			description: "Notes already placed on the canvas.",
			icon: NotebookPen,
		},
	];
}

function buildNoteTypeStats(
	notes: { type: string }[],
): Array<{ type: NoteTypeKey; label: string; count: number; percent: number }> {
	const counts: Record<NoteTypeKey, number> = {
		standard: 0,
		log: 0,
		address: 0,
		file: 0,
	};

	for (const note of notes) {
		if (note.type in counts) {
			counts[note.type as NoteTypeKey] += 1;
		}
	}

	return NOTE_TYPE_ORDER.map((type) => {
		const count = counts[type];
		const percent = notes.length === 0 ? 0 : Math.round((count / notes.length) * 100);
		return {
			type,
			label: NOTE_TYPE_LABELS[type],
			count,
			percent,
		};
	});
}

function buildTagUsage(
	notes: { tags: string[] }[],
): Array<{ name: string; count: number; color: string }> {
	const counts = new Map<string, number>();
	for (const note of notes) {
		for (const tag of note.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
		.map(([name, count]) => ({
			name,
			count,
			color: "#00f2ff",
		}));
}

function formatDate(value: string | Date): string {
	return new Date(value).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatCoordinates(lat: number, lng: number): string {
	return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
