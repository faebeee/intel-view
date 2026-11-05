import { HttpException, Inject, Injectable } from '@nestjs/common';
import type { Note, NoteType } from '../note/entities/note.entity';
import type { NotePlugin } from './plugin.interface';
import { formatCommand, NOTE_PLUGIN } from './plugin.interface';

/**
 * Holds the registry of all `NotePlugin` implementations (injected as a
 * multi-provider under the `NOTE_PLUGIN` token — see `PluginModule`), and
 * exposes operations to list the plugins applicable to a note type and to
 * execute a specific one against a note.
 */
@Injectable()
export class PluginRegistryService {
  constructor(@Inject(NOTE_PLUGIN) private readonly plugins: NotePlugin[]) {}

  /** Returns the plugins applicable to the given note type. */
  listForNoteType(noteType: NoteType): NotePlugin[] {
    return this.plugins.filter((plugin) => plugin.noteTypes.includes(noteType));
  }

  /** Returns all registered plugins. */
  listAllPlugins(): NotePlugin[] {
    return this.plugins;
  }

  /**
   * Returns the argv array that would be executed by the plugin for the given
   * note.
   */
  getCommand(plugin: NotePlugin, note: Note): string[] {
    return plugin.getCommand(note);
  }

  /**
   * Returns the display form of the command the plugin would execute. For
   * presentation only (note titles, API responses) — never executed.
   */
  getCommandString(plugin: NotePlugin, note: Note): string {
    return formatCommand(this.getCommand(plugin, note));
  }

  getPlugin(id: string): NotePlugin | undefined {
    return this.plugins.find((p) => p.id === id);
  }

  /**
   * Executes a plugin against a note and returns the command output. A command
   * that merely fails is reported as content rather than thrown, so the caller
   * can still persist the failure for the user to read. Infrastructure faults
   * (`HttpException`, e.g. the container runtime being unavailable) propagate
   * instead — persisting those as a note would be misleading.
   */
  async execute(note: Note, plugin: NotePlugin): Promise<string> {
    const argv = plugin.getCommand(note);

    try {
      return await plugin.execute(argv);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return `Command '${formatCommand(argv)}' failed\n\n${(error as Error).message}`;
    }
  }

  /**
   * Finds the plugin with the given `id` that's applicable to `note`'s type
   * and runs it against `note`, returning its string result. Throws
   * `NotFoundException` if no such applicable plugin exists.
   */
  async preview(plugin: NotePlugin, note: Note): Promise<string> {
    return plugin.preview(note);
  }
}
