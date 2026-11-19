import { BUILTIN_NOTE_TYPES } from './entities/note.entity';
import type { NoteType } from './entities/note.entity';

/**
 * Whether `type` is a custom software/service note type (e.g. 'ssh',
 * 'http'), i.e. anything other than the built-in types. Only these notes
 * carry a `version`.
 */
export function isSoftwareNoteType(type: NoteType): boolean {
  return !(BUILTIN_NOTE_TYPES as readonly string[]).includes(type);
}

/**
 * Normalizes an incoming `version` value: trims it and maps an empty string
 * to `null` (cleared). `undefined` (not provided) is passed through.
 */
export function normalizeNoteVersion(
  version: string | null | undefined,
): string | null | undefined {
  if (version === undefined || version === null) return version;
  const trimmed = version.trim();
  return trimmed === '' ? null : trimmed;
}
