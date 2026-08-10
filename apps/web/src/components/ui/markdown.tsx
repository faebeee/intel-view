import * as React from "react";
import { parseMarkdown, renderHtml } from "@tanstack/markdown";
import { noteLocationMarkdownExtension } from "#/components/ui/markdown/note-location-extension.ts";
import { noteReferenceMarkdownExtension } from "#/components/ui/markdown/note-reference-extension.ts";
import { cn } from "#/lib/utils.ts";

type MarkdownProps = {
	content: string;
	className?: string;
	/**
	 * Called when the user clicks a `[[NOTE_ID]]` reference chip rendered
	 * inline in the markdown. When omitted, reference chips are still
	 * displayed but are inert (not clickable).
	 */
	onNoteReferenceClick?: (noteId: number) => void;
};

const MARKDOWN_EXTENSIONS = [noteReferenceMarkdownExtension(), noteLocationMarkdownExtension()];

export function Markdown({
	content,
	className,
	onNoteReferenceClick,
}: MarkdownProps) {
	const html = React.useMemo(() => {
		try {
			const parsed = parseMarkdown(content, { extensions: MARKDOWN_EXTENSIONS });
			return renderHtml(parsed, { extensions: MARKDOWN_EXTENSIONS });
		} catch (err) {
			console.error("Failed to parse markdown:", err);
			return content;
		}
	}, [content]);

	const handleClick = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (!onNoteReferenceClick) return;
			const target = event.target as HTMLElement;
			const chip = target.closest<HTMLElement>("[data-note-reference]");
			if (!chip) return;
			const noteId = Number(chip.dataset.noteId);
			if (Number.isNaN(noteId)) return;
			event.preventDefault();
			onNoteReferenceClick(noteId);
		},
		[onNoteReferenceClick],
	);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: onClick only delegates to native <button> reference chips within the rendered HTML, which are already keyboard-accessible on their own
		// biome-ignore lint/a11y/useKeyWithClickEvents: see above - delegated target elements are real <button>s
		<div
			onClick={handleClick}
			className={cn(
				// This app has no light-mode variant (no `.dark` class is ever toggled
				// on the document), so `prose-invert` is applied unconditionally
				// rather than gated behind Tailwind's `dark:` variant.
				"prose prose-sm prose-invert max-w-none text-sea-ink-soft leading-relaxed",
				"prose-headings:text-sea-ink prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wider prose-headings:border-b prose-headings:border-line/20 prose-headings:pb-1",
				"prose-a:text-palm prose-a:no-underline hover:prose-a:underline",
				"prose-strong:text-sea-ink prose-strong:font-bold",
				"prose-code:text-palm prose-code:bg-surface/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs",
				"prose-pre:bg-[#040814]/80 prose-pre:border prose-pre:border-line/30 prose-pre:rounded-lg prose-pre:p-3",
				"prose-blockquote:border-l-2 prose-blockquote:border-palm prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
				className,
			)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: safe use of parsed markdown content from trust database
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
}
