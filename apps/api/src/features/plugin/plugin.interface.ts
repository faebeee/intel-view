import type { NoteType } from '../note/entities/note.entity';
import type { NoteResponseDto } from '../note/dto/note-response.dto';

/**
 * A note plugin generates a derived string (e.g. a code snippet) from a
 * note, surfaced in the frontend as a button in that note's sidebar on the
 * canvas view. Only shown/executable for note types listed in `noteTypes`.
 * Results are purely ephemeral — never persisted, only returned to the
 * caller for display.
 */
export type NotePlugin = {
  /** Stable, unique identifier for this plugin, used in the execute route. */
  id: string;
  /** Human-readable label shown on the plugin's button in the UI. */
  label: string;
  /** The note types this plugin is applicable to. */
  noteTypes: NoteType[];
  /** Runs the plugin against a note, returning the derived string result. */
  execute(note: NoteResponseDto): Promise<string> | string;
};

/**
 * Multi-provider DI token every `NotePlugin` implementation is registered
 * under (see `PluginModule`), so `PluginRegistryService` can inject the
 * full list of available plugins without each one needing to be wired in
 * individually.
 */
export const NOTE_PLUGIN = Symbol('NOTE_PLUGIN');
