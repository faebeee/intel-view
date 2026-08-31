import type * as React from "react";
import { cn } from "#/lib/utils.ts";

/** Shared uppercase, tracked-out label style used across every form field in the app. */
export const FIELD_LABEL_CLASS =
	"text-[10px] uppercase font-bold tracking-wider text-sea-ink-soft pl-1";

/**
 * "Terminal" input style: darker background, used for the denser
 * note/history forms (`CreateNoteModal`, notes `edit.tsx`). Only dark in
 * dark mode (part of the "HUD" look); light mode uses a subtle tinted
 * background instead, since a fixed dark navy would otherwise render as a
 * washed-out grey box (and clash with the dark text) against a light page.
 */
export const TERMINAL_INPUT_CLASS =
	"bg-black/[0.03] dark:bg-[#040814]/40 border border-line/50 rounded-lg p-3 text-xs font-mono h-auto text-sea-ink dark:text-palm placeholder:text-muted-foreground/50 dark:placeholder:text-muted-foreground/30 focus-visible:ring-1 focus-visible:ring-palm";

/**
 * "HUD" input style built on top of the shared `Input`/`Textarea`
 * components, used by the simpler project/tag forms. Only dark in dark
 * mode (part of the "HUD" look); light mode uses a subtle tinted
 * background instead, since a fixed dark navy would otherwise render as a
 * washed-out grey box (and clash with the dark text) against a light page.
 */
export const HUD_INPUT_CLASS =
	"bg-black/[0.03] dark:bg-[#040814]/60 border-line text-xs text-sea-ink dark:text-palm placeholder:text-muted-foreground/60 dark:placeholder:text-muted-foreground/50 focus-visible:ring-palm/30";

type FormFieldProps = {
	label: React.ReactNode;
	htmlFor?: string;
	hint?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
};

/**
 * Label + control wrapper shared by every form in the app (notes, tags,
 * projects). Centralizes the label styling so it only needs to change in
 * one place.
 */
export function FormField({
	label,
	htmlFor,
	hint,
	className,
	children,
}: FormFieldProps) {
	return (
		<div className={cn("flex flex-col gap-1.5", className)}>
			<label htmlFor={htmlFor} className={FIELD_LABEL_CLASS}>
				{label}
			</label>
			{children}
			{hint && (
				<p className="text-[9px] text-muted-foreground italic pl-1">{hint}</p>
			)}
		</div>
	);
}
