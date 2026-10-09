import { Link } from "@tanstack/react-router";
import { Edit2, FolderOpen, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { ConfirmationButton } from "#/features/common/components/ConfirmationButton.tsx";

type FolderCardProps = {
	to: string;
	name: string;
	description?: string | null;
	color: string;
	projectsCount: number;
	/** Virtual folders (e.g. "Ungrouped") can't be edited/deleted. */
	isVirtual?: boolean;
	onEdit?: () => void;
	onDelete?: () => void;
	isDeleting?: boolean;
};

/**
 * A single folder card on the dashboard. Clicking it navigates to that
 * folder's project list; edit/delete are inline actions for real folders
 * (the synthetic "Ungrouped" folder only supports navigation).
 */
export function FolderCard({
	to,
	name,
	description,
	color,
	projectsCount,
	isVirtual = false,
	onEdit,
	onDelete,
	isDeleting = false,
}: FolderCardProps): JSX.Element {
	return (
		<Card className="border-line bg-surface-strong/80 backdrop-blur-md hover:border-palm/40 transition-colors">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base font-bold text-sea-ink font-mono truncate">
					<span
						className="size-3 rounded-full shrink-0 border border-black/30"
						style={{ backgroundColor: color }}
					/>
					{name}
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				<p className="text-xs line-clamp-2 min-h-[2rem] text-muted-foreground">
					{description || (
						<span className="italic text-muted-foreground/60">
							No description
						</span>
					)}
				</p>
				<span className="text-[10px] text-muted-foreground font-mono">
					{projectsCount} {projectsCount === 1 ? "project" : "projects"}
				</span>
			</CardContent>
			<CardFooter className="flex items-center justify-between gap-2">
				<Link to={to}>
					<Button variant="default" size="xs">
						<FolderOpen className="h-3 w-3" />
						<span>Open</span>
					</Button>
				</Link>
				{!isVirtual && (
					<div className="flex items-center gap-2">
						<Button variant="outline" size="xs" onClick={onEdit}>
							<Edit2 className="h-3 w-3" />
							<span>Edit</span>
						</Button>
						<ConfirmationButton
							variant="outline"
							size="xs"
							onClick={onDelete}
							disabled={isDeleting}
							title="Delete Folder"
							description={`Are you sure you want to delete "${name}"? Its projects will become ungrouped.`}
							confirmText="Delete"
						>
							<Trash2 className="h-3 w-3" />
							<span>Delete</span>
						</ConfirmationButton>
					</div>
				)}
			</CardFooter>
		</Card>
	);
}
