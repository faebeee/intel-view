import { parseMarkdown, renderHtml } from "@tanstack/markdown";
import * as React from "react";
import { cn } from "#/lib/utils.ts";

type MarkdownProps = {
	content: string;
	className?: string;
};

/**
 * Converts stray newlines left over from soft line breaks (e.g. inside a
 * single paragraph) into visible `<br>` tags. `@tanstack/markdown` follows
 * CommonMark and only splits text into block elements (paragraphs, list
 * items, etc.); a single `\n` within a paragraph is preserved as a literal
 * character in the text content but is not rendered as a line break by
 * browsers. `<pre>` blocks (code fences) already preserve whitespace via
 * the default `white-space: pre` styling, so they're left untouched to
 * avoid doubling up line breaks.
 */
function addLineBreaks(html: string): string {
	return html
		.split(/(<pre[\s\S]*?<\/pre>)/)
		.map((segment, index) =>
			index % 2 === 0
				? // Newlines used purely for formatting between block-level tags
					// are always immediately preceded by `>` and followed by `<`
					// (e.g. `</h1>\n<p>`). Only newlines embedded within actual
					// text content should become visible `<br>` line breaks.
					segment.replace(/(?<=[^>])\n(?=[^<])/g, "<br>\n")
				: segment,
		)
		.join("");
}

export function Markdown({ content, className }: MarkdownProps) {
	const html = React.useMemo(() => {
		try {
			return addLineBreaks(renderHtml(parseMarkdown(content)));
		} catch (err) {
			console.error("Failed to parse markdown:", err);
			return content;
		}
	}, [content]);

	return (
		<div
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
