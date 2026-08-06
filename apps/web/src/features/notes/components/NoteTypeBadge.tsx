import type { NoteResponseDto as Note } from "@repo/sdk";
import { getNoteTypeOption } from "#/features/notes/noteTypes.ts";

type NoteTypeBadgeProps = {
	type: Note["type"];
	className?: string;
};

export function NoteTypeBadge({ type, className }: NoteTypeBadgeProps) {
	const option = getNoteTypeOption(type);
	const Icon = option.icon;

	return (
		<span
			className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border border-palm/30 bg-palm/10 text-palm ${className ?? ""}`}
			title={option.description}
		>
			<Icon className="h-3 w-3" />
			<span>{option.label}</span>
		</span>
	);
}
