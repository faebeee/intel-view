import { Link } from "@tanstack/react-router";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";
import { McButton } from "#/features/common/components/McButton.tsx";
import { cn } from "#/lib/utils.ts";

type FolderCardProps = {
	to: string;
	name: string;
	description?: string | null;
	color: string;
	projectsCount: number;
	/** Most-used folder: gets the accent edge (handoff §03 "Folder card"). */
	highlighted?: boolean;
	/** Virtual folders (e.g. "Ungrouped") can't be edited/deleted. */
	isVirtual?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	isDeleting?: boolean;
};

/**
 * A single folder card on the dashboard. The name and OPEN link navigate to
 * the folder's project list; edit/delete are separate buttons for real
 * folders (the synthetic "Ungrouped" folder only supports navigation).
 *
 * The 1px border is the outer wrapper's background showing through its 1px
 * padding, because a CSS border can't follow the clipped corner.
 */
export function FolderCard({
	to,
	name,
	description,
	color,
	projectsCount,
	highlighted = false,
	isVirtual = false,
	onEdit,
	onDelete,
	isDeleting = false,
}: FolderCardProps): JSX.Element {
	return (
		<article
			className={cn(
				"cut-tr-lg p-px",
				highlighted ? "bg-mc-accent/45" : "bg-mc-border-strong",
			)}
		>
			<div className="cut-tr-lg-inner flex h-full min-h-[220px] flex-col gap-[18px] bg-mc-panel p-5">
				<div className="flex min-h-8 items-center gap-2 font-mono text-[10.5px] tracking-[0.12em] text-mc-text-muted">
					<span
						aria-hidden="true"
						className="size-[7px] shrink-0"
						style={{ background: color, boxShadow: `0 0 8px ${color}` }}
					/>
					<span>FOLDER</span>
					<span className="flex-1" />
					{!isVirtual && (
						<>
							<McButton
								variant="ghost"
								size="icon-sm"
								aria-label={`Edit folder ${name}`}
								title="Edit folder"
								onClick={onEdit}
							>
								<Pencil className="size-[15px]" strokeWidth={1.75} />
							</McButton>
							<ConfirmationButton
								onClick={onDelete}
								title={`Delete folder "${name}"?`}
								description={`Its ${projectsCount} ${projectsCount === 1 ? "project" : "projects"} will move to Ungrouped. The projects themselves are not deleted.`}
								confirmText="Delete folder"
								trigger={
									<McButton
										variant="ghost"
										size="icon-sm"
										aria-label={`Delete folder ${name}`}
										title="Delete folder"
										disabled={isDeleting}
										className="hover:text-mc-danger-text"
									>
										<Trash2 className="size-[15px]" strokeWidth={1.75} />
									</McButton>
								}
							/>
						</>
					)}
				</div>

				<div className="flex min-w-0 flex-col gap-1.5">
					<Link
						to={to}
						className="font-display text-2xl leading-[1.1] font-semibold tracking-[0.02em] break-words text-mc-text no-underline uppercase hover:text-mc-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent"
					>
						{name}
					</Link>
					<p
						className={cn(
							"m-0 line-clamp-3 text-[13.5px] leading-normal",
							description ? "text-mc-text-2" : "text-mc-text-muted",
						)}
					>
						{description || "No description"}
					</p>
				</div>

				<div className="flex-1" />

				<div className="flex items-end justify-between gap-3 border-t border-mc-border pt-3.5">
					<div className="flex items-baseline gap-2">
						<span className="font-display text-[30px] leading-none font-semibold text-mc-text">
							{projectsCount}
						</span>
						<span className="font-mono text-[10.5px] tracking-[0.12em] text-mc-text-muted">
							{projectsCount === 1 ? "PROJECT" : "PROJECTS"}
						</span>
					</div>
					<McButton variant="link" size="sm" asChild>
						<Link to={to} aria-label={`Open folder ${name}`}>
							Open
							<ArrowRight className="size-3.5" />
						</Link>
					</McButton>
				</div>
			</div>
		</article>
	);
}
