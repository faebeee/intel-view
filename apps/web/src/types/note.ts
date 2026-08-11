import type { NoteResponseDto } from "@repo/sdk";

export type {
	CreateNoteDto,
	NoteResponseDto,
	UpdateNoteDto,
} from "@repo/sdk";

/** The kind of note: `'standard'` (freely-editable rich text) or `'log'` (append-only timestamped entries). Set at creation and immutable afterwards. */
export type NoteType = NoteResponseDto["type"];

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
