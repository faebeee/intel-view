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
  /** Represents new noteType of a child if created from this plugin */
  noteType: NoteType;
  /** Whether this plugin is executable. */
  executable: boolean;
  /** Previews the plugin against a note, returning the derived string result. */
  preview(note: Note): Promise<string> | string;
  /**
   * Executes `argv` and returns the output.
   *
   * `argv` is passed to `execFile` as an argument array — no shell is spawned,
   * so shell metacharacters in any element are inert. Implementations MUST NOT
   * join `argv` back into a string or hand it to a shell.
   */
  execute(argv: string[]): Promise<string>;
  /**
   * Returns the argv array that would be executed for the given note, with the
   * program name at index 0 and excluding any container/runtime prefix.
   */
  getCommand(note: Note): string[];
};

/**
 * Renders an argv array as a single human-readable string for display only —
 * note titles, API responses, error messages.
 *
 * The result is NEVER executed. Elements containing characters outside a
 * conservative safe set are single-quoted so the rendered form is unambiguous
 * about where one argument ends and the next begins.
 */
export function formatCommand(argv: string[]): string {
  return argv
    .map((arg) =>
      /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg)
        ? arg
        : `'${arg.replaceAll("'", `'\\''`)}'`,
    )
    .join(' ');
}

/**
 * Multi-provider DI token every `NotePlugin` implementation is registered
 * under (see `PluginModule`), so `PluginRegistryService` can inject the
 * full list of available plugins without each one needing to be wired in
 * individually.
 */
export const NOTE_PLUGIN = Symbol('NOTE_PLUGIN');
