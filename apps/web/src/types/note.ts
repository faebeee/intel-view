import type { NoteResponseDto } from "@repo/sdk";

export type {
	CreateNoteDto,
	NoteResponseDto,
	UpdateNoteDto,
} from "@repo/sdk";

/**
 * The kind of note. Built-in: `'standard'` (freely-editable rich text),
 * `'log'` (append-only timestamped entries), `'file'` (single uploaded
 * file), `'url'` (single URL), `'ip'` (single IPv4/IPv6 address), or
 * `'command'` (shell command and output). Any other lowercase slug (e.g.
 * `'ftp'`, `'ssh'`, `'http'`) names a custom software/service note —
 * content behaves like `'standard'`, but the note can be targeted by its
 * own plugins. Set at creation and immutable afterwards.
 */
 export type NoteType = NoteResponseDto["type"];
 
 /** The six note types with special built-in behavior; every other `NoteType` value is a custom software/service type. */
 export const BUILTIN_NOTE_TYPES = [
 	"standard",
 	"log",
 	"file",
 	"url",
 	"ip",
 	"command",
 ] as const;

/**
 * Suggested values for the specific service/software type chosen in the
 * "New Note" dialog's second step (e.g. 'ftp', 'ssh'), which becomes the
 * created note's `type` directly. Not an enforced allow-list — the user
 * can also type any other lowercase slug by hand.
 */
export const SOFTWARE_TYPE_SUGGESTIONS = [
	"http",
	"https",
	"ssh",
	"ftp",
	"ftps",
	"smtp",
	"dns",
	"rdp",
	"smb",
	"telnet",
	"mysql",
	"postgres",
] as const;

/**
 * Normalizes free-typed text into a valid custom `NoteType` slug: lowercases,
 * replaces runs of non `[a-z0-9]` characters with a single hyphen, strips
 * leading/trailing hyphens, and truncates to the backend's 40-char limit.
 * Returns an empty string if nothing alphanumeric remains.
 */
export function slugifyNoteType(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40);
}

export type PaginatedResponse<T> = {
	data: T[];
	meta: {
		itemsPerPage: number;
		totalItems: number;
		currentPage: number;
		totalPages: number;
		sortBy: [string, string][];
		searchBy: string[];
		search: string;
		select: string[];
		filter?: Record<string, string | string[]>;
	};
	links: {
		first?: string;
		previous?: string;
		current: string;
		next?: string;
		last?: string;
	};
};
