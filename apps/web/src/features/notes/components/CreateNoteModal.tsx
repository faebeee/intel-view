import {
	FileText,
	Link,
	Network,
	Paperclip,
	ScrollText,
	Server,
	Mail,
	Terminal,
} from "lucide-react";
import * as React from "react";
import { Button } from "#/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog.tsx";
import { Input } from "#/components/ui/input.tsx";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group.tsx";
import { cn } from "#/lib/utils.ts";
import {
	type NoteType,
	SOFTWARE_TYPE_SUGGESTIONS,
	slugifyNoteType,
} from "#/types/note.ts";

export type CreateNoteModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Called with the chosen note type when the user confirms creation. The caller owns which parent (if any) the note is created under. */
	onCreate: (params: { type: NoteType; title?: string; content?: string }) => void;
	isCreating?: boolean;
};

/** Step-1 radio value: either a real `NoteType` or the "software" sentinel, which isn't a storable note type — picking it advances to step 2 instead of submitting. */
type TypeChoice = NoteType | "software";

type NoteTypeOption = {
	value: TypeChoice;
	label: string;
	description: string;
	icon: typeof FileText;
};

const NOTE_TYPE_OPTIONS: NoteTypeOption[] = [
	{
		value: "standard",
		label: "Note",
		description: "A freely-editable rich text note.",
		icon: FileText,
	},
	{
		value: "log",
		label: "Log",
		description:
			"An append-only timestamped log — write entries over time instead of editing one document.",
		icon: ScrollText,
	},
	{
		value: "file",
		label: "File",
		description:
			"A note holding a single uploaded file, stored in object storage and served through the API.",
		icon: Paperclip,
	},
	{
		value: "url",
		label: "Link",
		description: "A note holding a single URL.",
		icon: Link,
	},
	{
		value: "ip",
		label: "IP Address",
		description: "A note holding a single IPv4 or IPv6 address.",
		icon: Network,
	},
	{
		value: "command",
		label: "Command",
		description: "A note storing a shell command and its output.",
		icon: Terminal,
	},
	{
		value: "email",
		label: "Email",
		description: "A note holding a single email address for OSINT purposes.",
		icon: Mail,
	},
	{
		value: "software",
		label: "Software",
		description:
			"A service running on a host (e.g. http, ssh, ftp) — lets you register custom recon commands per service. Pick the specific service on the next step.",
		icon: Server,
	},
];

/**
 * Small dialog shown before creating a note, letting the user pick its
 * type. A note's type is set once here and can't be changed afterwards
 * (see `Note.type` on the backend). Picking "Software" doesn't create a
 * `'software'`-type note — there is no such type — instead it advances to
 * a second step where the user picks (or types) the specific service, and
 * *that* becomes the note's actual `type` (e.g. `'ftp'`), so plugins can
 * target that service directly.
 */
export function CreateNoteModal({
	open,
	onOpenChange,
	onCreate,
	isCreating = false,
}: CreateNoteModalProps) {
	const [step, setStep] = React.useState<"type" | "software-subtype">("type");
	const [type, setType] = React.useState<TypeChoice>("standard");
	const [customSubtype, setCustomSubtype] = React.useState("");
	const [selectedSubtype, setSelectedSubtype] = React.useState<string | null>(
		null,
	);

	// Reset to the default choice every time the dialog is (re)opened.
	React.useEffect(() => {
		if (!open) return;
		setStep("type");
		setType("standard");
		setCustomSubtype("");
		setSelectedSubtype(null);
	}, [open]);

	const handleTypeStepSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (type === "software") {
			setStep("software-subtype");
			return;
		}
		onCreate({ type });
	};

	const resolvedCustomSubtype = slugifyNoteType(customSubtype);
	const finalSubtype = selectedSubtype ?? resolvedCustomSubtype;

	const handleSoftwareStepSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!finalSubtype) return;
		onCreate({ type: finalSubtype });
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="border-line bg-surface-strong/95 backdrop-blur-md text-sea-ink max-w-md shadow-2xl shadow-black/80">
				{step === "type" ? (
					<>
						<DialogHeader className="space-y-1">
							<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
								New Note
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
								Choose what kind of note to create.
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleTypeStepSubmit} className="space-y-2 my-2">
							<RadioGroup
								value={type}
								onValueChange={(value) => setType(value as TypeChoice)}
								className="gap-2"
							>
								{NOTE_TYPE_OPTIONS.map((option) => {
									const Icon = option.icon;
									const isSelected = type === option.value;
									return (
										<label
											key={option.value}
											htmlFor={`note-type-${option.value}`}
											className={cn(
												"flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
												isSelected
													? "border-palm bg-palm/10"
													: "border-line/50 hover:bg-surface-strong/60",
											)}
										>
											<RadioGroupItem
												id={`note-type-${option.value}`}
												value={option.value}
												className="mt-0.5"
											/>
											<Icon className="h-4 w-4 shrink-0 text-palm mt-0.5" />
											<div className="flex flex-col gap-0.5">
												<span className="text-sm font-bold text-sea-ink">
													{option.label}
												</span>
												<span className="text-xs text-muted-foreground leading-snug">
													{option.description}
												</span>
											</div>
										</label>
									);
								})}
							</RadioGroup>

							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => onOpenChange(false)}
									disabled={isCreating}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									variant="default"
									size="sm"
									disabled={isCreating}
								>
									{type === "software"
										? "Next"
										: isCreating
											? "Creating..."
											: "Create"}
								</Button>
							</DialogFooter>
						</form>
					</>
				) : (
					<>
						<DialogHeader className="space-y-1">
							<DialogTitle className="text-lg font-bold text-sea-ink uppercase tracking-wider font-mono">
								Choose Service Type
							</DialogTitle>
							<DialogDescription className="text-xs text-muted-foreground leading-relaxed">
								Pick a service from the list or type your own. This becomes the
								note's type, so you can register custom recon commands for it.
							</DialogDescription>
						</DialogHeader>

						<form
							onSubmit={handleSoftwareStepSubmit}
							className="space-y-3 my-2"
						>
							<div className="flex flex-wrap gap-1.5">
								{SOFTWARE_TYPE_SUGGESTIONS.map((suggestion) => {
									const isSelected = selectedSubtype === suggestion;
									return (
										<button
											key={suggestion}
											type="button"
											onClick={() => {
												setSelectedSubtype(suggestion);
												setCustomSubtype("");
											}}
											className={cn(
												"rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wide transition-colors",
												isSelected
													? "border-palm bg-palm/10 text-sea-ink"
													: "border-line/50 text-muted-foreground hover:bg-surface-strong/60",
											)}
										>
											{suggestion}
										</button>
									);
								})}
							</div>
							<div className="flex flex-col gap-1.5">
								<label
									htmlFor="note-software-custom-type"
									className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
								>
									Or type a custom service
								</label>
								<Input
									id="note-software-custom-type"
									value={customSubtype}
									onChange={(e) => {
										setCustomSubtype(e.target.value);
										setSelectedSubtype(null);
									}}
									placeholder="e.g. rdp, mssql, custom-proto"
								/>
							</div>
							<DialogFooter className="pt-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setStep("type")}
									disabled={isCreating}
								>
									Back
								</Button>
								<Button
									type="submit"
									variant="default"
									size="sm"
									disabled={isCreating || !finalSubtype}
								>
									{isCreating ? "Creating..." : "Create"}
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

