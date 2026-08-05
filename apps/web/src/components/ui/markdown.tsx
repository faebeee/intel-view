import * as React from "react";
import { parseMarkdown, renderHtml } from "@tanstack/markdown";
import { cn } from "#/lib/utils.ts";

type MarkdownProps = {
	content: string;
	className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
	const html = React.useMemo(() => {
		try {
			const parsed = parseMarkdown(content);
			return renderHtml(parsed);
		} catch (err) {
			console.error("Failed to parse markdown:", err);
			return content;
		}
	}, [content]);

	return (
		<div
			className={cn(
				"prose prose-sm dark:prose-invert max-w-none text-sea-ink-soft leading-relaxed",
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
