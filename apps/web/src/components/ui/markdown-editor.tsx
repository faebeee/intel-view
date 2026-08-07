"use client";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Code,
	Columns,
	Edit2,
	Eye,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Quote,
	Redo2,
	Strikethrough,
	Undo2,
} from "lucide-react";
import * as React from "react";
import { Markdown as MarkdownExtension } from "tiptap-markdown";
import { cn } from "#/lib/utils.ts";
import { Button } from "./button";
import { Markdown } from "./markdown";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

type MarkdownEditorProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	minHeight?: string;
};

function ToolbarButton({
	onClick,
	active,
	disabled,
	title,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-xs"
			onClick={onClick}
			disabled={disabled}
			title={title}
			aria-pressed={active}
			className={cn(
				"text-sea-ink-soft hover:text-palm",
				active && "bg-accent/15 text-palm",
			)}
		>
			{children}
		</Button>
	);
}

function EditorToolbar({
	editor,
	disabled,
}: {
	editor: Editor | null;
	disabled?: boolean;
}) {
	if (!editor) return null;

	const setLink = () => {
		const previousUrl = editor.getAttributes("link").href as string | undefined;
		const url = window.prompt("Enter URL", previousUrl ?? "https://");
		if (url === null) return;
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
	};

	return (
		<div className="flex flex-wrap items-center gap-0.5 border border-line/45 bg-surface-strong/65 rounded-md p-1">
			<ToolbarButton
				title="Bold"
				disabled={disabled}
				active={editor.isActive("bold")}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<Bold className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Italic"
				disabled={disabled}
				active={editor.isActive("italic")}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			>
				<Italic className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Strikethrough"
				disabled={disabled}
				active={editor.isActive("strike")}
				onClick={() => editor.chain().focus().toggleStrike().run()}
			>
				<Strikethrough className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Inline code"
				disabled={disabled}
				active={editor.isActive("code")}
				onClick={() => editor.chain().focus().toggleCode().run()}
			>
				<Code className="h-3 w-3" />
			</ToolbarButton>

			<span className="mx-1 h-4 w-px bg-line/40" />

			<ToolbarButton
				title="Heading 1"
				disabled={disabled}
				active={editor.isActive("heading", { level: 1 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
			>
				<Heading1 className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Heading 2"
				disabled={disabled}
				active={editor.isActive("heading", { level: 2 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
			>
				<Heading2 className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Heading 3"
				disabled={disabled}
				active={editor.isActive("heading", { level: 3 })}
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
			>
				<Heading3 className="h-3 w-3" />
			</ToolbarButton>

			<span className="mx-1 h-4 w-px bg-line/40" />

			<ToolbarButton
				title="Bullet list"
				disabled={disabled}
				active={editor.isActive("bulletList")}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			>
				<List className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Ordered list"
				disabled={disabled}
				active={editor.isActive("orderedList")}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			>
				<ListOrdered className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Blockquote"
				disabled={disabled}
				active={editor.isActive("blockquote")}
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
			>
				<Quote className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Code block"
				disabled={disabled}
				active={editor.isActive("codeBlock")}
				onClick={() => editor.chain().focus().toggleCodeBlock().run()}
			>
				<Code className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Link"
				disabled={disabled}
				active={editor.isActive("link")}
				onClick={setLink}
			>
				<LinkIcon className="h-3 w-3" />
			</ToolbarButton>

			<span className="mx-1 h-4 w-px bg-line/40" />

			<ToolbarButton
				title="Undo"
				disabled={disabled || !editor.can().undo()}
				onClick={() => editor.chain().focus().undo().run()}
			>
				<Undo2 className="h-3 w-3" />
			</ToolbarButton>
			<ToolbarButton
				title="Redo"
				disabled={disabled || !editor.can().redo()}
				onClick={() => editor.chain().focus().redo().run()}
			>
				<Redo2 className="h-3 w-3" />
			</ToolbarButton>
		</div>
	);
}

/**
 * Returns the current document serialized as markdown, using the
 * `tiptap-markdown` extension's storage API.
 */
function getMarkdown(editor: Editor): string {
	return (
		editor.storage as unknown as { markdown: { getMarkdown(): string } }
	).markdown.getMarkdown();
}

function useMarkdownEditor({
	value,
	onChange,
	placeholder,
	disabled,
}: Pick<
	MarkdownEditorProps,
	"value" | "onChange" | "placeholder" | "disabled"
>): Editor | null {
	// Tracks the last markdown string emitted by (or fed into) this editor
	// instance, so external `value` updates (e.g. hydrating from an API
	// response) can be distinguished from the editor echoing its own change
	// back through the controlled `value` prop.
	const lastValueRef = React.useRef(value);

	const editor = useEditor({
		extensions: [
			StarterKit,
			LinkExtension.configure({ openOnClick: false, autolink: true }),
			Placeholder.configure({ placeholder }),
			MarkdownExtension.configure({
				html: false,
				transformCopiedText: true,
			}),
		],
		content: value,
		editable: !disabled,
		onUpdate: ({ editor: updatedEditor }) => {
			const markdown = getMarkdown(updatedEditor);
			lastValueRef.current = markdown;
			onChange(markdown);
		},
		editorProps: {
			attributes: {
				class: "focus:outline-none",
			},
		},
	});

	React.useEffect(() => {
		if (!editor) return;
		editor.setEditable(!disabled);
	}, [editor, disabled]);

	React.useEffect(() => {
		if (!editor) return;
		if (value === lastValueRef.current) return;
		lastValueRef.current = value;
		editor.commands.setContent(value);
	}, [editor, value]);

	return editor;
}

export function MarkdownEditor({
	value,
	onChange,
	placeholder = "Write content here...",
	disabled = false,
	className,
	minHeight = "min-h-32",
}: MarkdownEditorProps) {
	const [mode, setMode] = React.useState<"tabbed" | "split">("tabbed");
	const [activeTab, setActiveTab] = React.useState("write");

	const editor = useMarkdownEditor({ value, onChange, placeholder, disabled });

	const writePane = (
		<div className="flex flex-col gap-2">
			<EditorToolbar editor={editor} disabled={disabled} />
			<div
				className={cn(
					"bg-[#040814]/60 border border-line rounded-lg px-3 py-2 overflow-y-auto",
					"prose prose-sm prose-invert max-w-none text-sea-ink-soft leading-relaxed",
					"prose-headings:text-sea-ink prose-headings:font-bold",
					"prose-a:text-palm prose-a:no-underline hover:prose-a:underline",
					"prose-strong:text-sea-ink prose-strong:font-bold",
					"prose-code:text-palm prose-code:bg-surface/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs",
					"prose-pre:bg-[#040814]/80 prose-pre:border prose-pre:border-line/30 prose-pre:rounded-lg prose-pre:p-3",
					"[&_.tiptap]:focus:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
					minHeight,
				)}
			>
				<EditorContent editor={editor} />
			</div>
		</div>
	);

	const previewPane = (
		<div
			className={cn(
				"bg-[#040814]/40 border border-line/45 rounded-lg p-4 overflow-y-auto leading-relaxed max-h-96",
				minHeight,
			)}
		>
			{value.trim() ? (
				<Markdown content={value} />
			) : (
				<span className="text-xs text-muted-foreground font-mono italic">
					No content entered. Write in the editor to preview.
				</span>
			)}
		</div>
	);

	return (
		<div className={cn("flex flex-col gap-3 w-full", className)}>
			{/* Toolbar / Control Header */}
			<div className="flex items-center justify-between gap-4 border-b border-line/35 pb-2">
				<div className="flex items-center gap-2">
					{mode === "tabbed" ? (
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-auto"
						>
							<TabsList className="bg-surface-strong/65 border border-line/45 p-0.5">
								<TabsTrigger
									value="write"
									className="text-xs font-mono font-bold tracking-wider px-3 h-7 data-[state=active]:bg-accent/15 data-[state=active]:text-palm gap-1.5"
								>
									<Edit2 className="h-3 w-3" />
									<span>WRITE</span>
								</TabsTrigger>
								<TabsTrigger
									value="preview"
									className="text-xs font-mono font-bold tracking-wider px-3 h-7 data-[state=active]:bg-accent/15 data-[state=active]:text-palm gap-1.5"
								>
									<Eye className="h-3 w-3" />
									<span>PREVIEW</span>
								</TabsTrigger>
							</TabsList>
						</Tabs>
					) : (
						<span className="text-xs font-mono font-bold tracking-wider text-palm bg-accent/10 px-2.5 py-1 rounded border border-palm/20 uppercase">
							Split View
						</span>
					)}
				</div>

				{/* Editor Mode Toggler */}
				<div>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={() => {
							setMode((prev) => (prev === "tabbed" ? "split" : "tabbed"));
						}}
						title={
							mode === "tabbed"
								? "Switch to split view"
								: "Switch to tabbed view"
						}
					>
						<Columns className="h-3 w-3" />
						<span>{mode === "tabbed" ? "SPLIT SCREEN" : "TABBED VIEW"}</span>
					</Button>
				</div>
			</div>

			{/* Editor Content Area */}
			{mode === "tabbed" ? (
				<div className="flex-1 min-h-0">
					{activeTab === "write" ? writePane : previewPane}
				</div>
			) : (
				/* Split Screen Mode */
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
					{/* Write Column */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
							Write
						</span>
						{writePane}
					</div>

					{/* Live Render Column */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
							Preview
						</span>
						{previewPane}
					</div>
				</div>
			)}
		</div>
	);
}
