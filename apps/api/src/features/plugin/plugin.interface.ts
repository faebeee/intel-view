import type { Note, NoteType } from '../note/entities/note.entity';

/**
 * A note plugin generates a derived string (e.g. a code snippet) from a
 * note, surfaced in the frontend as a button in that note's sidebar on the
 * canvas view. Only shown/executable for note types listed in `noteTypes`.
 * Results are purely ephemeral — never persisted, only returned to the
 * caller for display.
 */
export type NotePlugin = {
  /** Stable, unique identifier for this plugin, used in the preview route. */
  id: string;
  /** Human-readable label shown on the plugin's button in the UI. */
  label: string;
  /** The note types this plugin is applicable to. */
  noteTypes: NoteType[];
  /** Whether this plugin is executable. */
  executable: boolean;
  /** Previews the plugin against a note, returning the derived string result. */
  preview(note: Note): Promise<string> | string;
  /**
   * Executes a command and returns the output.
   * IMPORTANT: Implementations MUST sanitize the `command` to prevent shell injection.
   */
  execute(command: string): Promise<string>;
  /** Returns the command that would be executed for the given note. */
  getCommand(note: Note): string;
};

/**
 * Multi-provider DI token every `NotePlugin` implementation is registered
 * under (see `PluginModule`), so `PluginRegistryService` can inject the
 * full list of available plugins without each one needing to be wired in
 * individually.
 */
export const NOTE_PLUGIN = Symbol('NOTE_PLUGIN');
