/**
 * Remembers the last opened project (per browser) so the rail's Canvas item
 * can reopen it and the project table can mark it. Storage can be
 * unavailable (private mode, blocked site data), so every access is guarded.
 */

const LAST_PROJECT_KEY = "intel-view:last-project";

export function readLastProjectId(): string | null {
	try {
		return window.localStorage.getItem(LAST_PROJECT_KEY);
	} catch {
		return null;
	}
}

export function writeLastProjectId(projectId: string): void {
	try {
		window.localStorage.setItem(LAST_PROJECT_KEY, projectId);
	} catch {
		// Storage unavailable — the in-memory value is enough.
	}
}
