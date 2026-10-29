"use client";

import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	AtSign,
	Bold,
	Code,
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
import { NoteReference } from "#/components/ui/markdown-editor/note-reference-node.ts";
import { cn } from "#/lib/utils.ts";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type MarkdownEditorNoteOption = {
	id: number;
	/** Short human-readable label shown in the reference picker (notes have no title, so this is typically a truncated content snippet). */
	label: string;
};

type MarkdownEditorProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	minHeight?: string;
	/**
	 * When provided, enables the "Reference note" toolbar button, letting
	 * users pick one of these notes to insert as a `[[NOTE_ID]]` reference.
	 * Omit to hide the button (e.g. when this editor isn't editing note
	 * content, or the note list isn't available).
	 */
	notes?: MarkdownEditorNoteOption[];
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
	notes,
}: {
	editor: Editor | null;
	disabled?: boolean;
	notes?: MarkdownEditorNoteOption[];
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
			{notes && (
				<NoteReferencePicker
					editor={editor}
					disabled={disabled}
					notes={notes}
				/>
			)}

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
 * Toolbar control letting users search the project's notes and insert a
 * `[[NOTE_ID]]` reference to one of them at the cursor position. Notes have
 * no title, so each entry is labelled with a short content snippet.
 */
function NoteReferencePicker({
	editor,
	disabled,
	notes,
}: {
	editor: Editor;
	disabled?: boolean;
	notes: MarkdownEditorNoteOption[];
}) {
	const [open, setOpen] = React.useState(false);

	const handleSelect = (noteId: number) => {
		editor.chain().focus().insertNoteReference(noteId).run();
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<span>
					<ToolbarButton
						title="Reference note"
						disabled={disabled}
						active={open}
						onClick={() => setOpen((prev) => !prev)}
					>
						<AtSign className="h-3 w-3" />
					</ToolbarButton>
				</span>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-0" align="start">
				<Command>
					<CommandInput placeholder="Search notes by content..." />
					<CommandList>
						<CommandEmpty>No notes found.</CommandEmpty>
						<CommandGroup>
							{notes.map((note) => (
								<CommandItem
									key={note.id}
									value={`${note.id} ${note.label}`}
									onSelect={() => handleSelect(note.id)}
								>
									<span className="font-mono text-xs font-bold text-palm shrink-0">
										#{note.id}
									</span>
									<span className="truncate">{note.label}</span>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
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
			NoteReference,
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
	notes,
}: MarkdownEditorProps) {
	const editor = useMarkdownEditor({ value, onChange, placeholder, disabled });

	return (
		<div className={cn("flex flex-col gap-2 w-full", className)}>
			<EditorToolbar editor={editor} disabled={disabled} notes={notes} />
			<div
				className={cn(
					"bg-surface-strong/40 border border-line rounded-lg px-3 py-2 overflow-y-auto",
					"prose prose-sm prose-invert max-w-none text-sea-ink-soft leading-relaxed",
					"prose-headings:text-sea-ink prose-headings:font-bold",
					"prose-a:text-palm prose-a:no-underline hover:prose-a:underline",
					"prose-strong:text-sea-ink prose-strong:font-bold",
					"prose-code:text-palm prose-code:bg-surface/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-xs",
					"prose-pre:bg-surface/70 prose-pre:border prose-pre:border-line/30 prose-pre:rounded-lg prose-pre:p-3",
					"[&_.tiptap]:focus:outline-none [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:h-0",
					"flex-1 min-h-0",
					minHeight,
				)}
			>
				<EditorContent editor={editor} />
			</div>
		</div>
	);
}
