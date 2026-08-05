"use client";

import * as React from "react";
import { Eye, Edit2, Columns } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { Textarea } from "./textarea";
import { Markdown } from "./markdown";
import { Button } from "./button";
import { cn } from "#/lib/utils.ts";

type MarkdownEditorProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	minHeight?: string;
};

export function MarkdownEditor({
	value,
	onChange,
	placeholder = "Write markdown content here...",
	disabled = false,
	className,
	minHeight = "min-h-32",
}: MarkdownEditorProps) {
	const [mode, setMode] = React.useState<"tabbed" | "split">("tabbed");
	const [activeTab, setActiveTab] = React.useState("write");

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
							Live Split Terminal
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
						className="font-mono text-[10px] text-muted-foreground hover:text-palm hover:bg-accent/10 gap-1.5 border border-line/20 h-7"
						title={
							mode === "tabbed"
								? "Switch to live split view"
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
					{activeTab === "write" ? (
						<Textarea
							placeholder={placeholder}
							className={cn(
								"bg-[#040814]/60 border-line text-xs leading-relaxed focus-visible:ring-palm/30 resize-y",
								minHeight,
							)}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							disabled={disabled}
						/>
					) : (
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
					)}
				</div>
			) : (
				/* Split Screen Mode */
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
					{/* Write Column */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
							Source Input
						</span>
						<Textarea
							placeholder={placeholder}
							className={cn(
								"bg-[#040814]/60 border-line text-xs leading-relaxed focus-visible:ring-palm/30 resize-none h-64 md:h-80",
								minHeight,
							)}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							disabled={disabled}
						/>
					</div>

					{/* Live Render Column */}
					<div className="flex flex-col gap-1.5">
						<span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest pl-1">
							Live Render Output
						</span>
						<div
							className={cn(
								"bg-[#040814]/40 border border-line/45 rounded-lg p-4 overflow-y-auto leading-relaxed h-64 md:h-80 max-h-96",
								minHeight,
							)}
						>
							{value.trim() ? (
								<Markdown content={value} />
							) : (
								<span className="text-xs text-muted-foreground font-mono italic">
									Empty record. Enter intel source data to preview.
								</span>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
