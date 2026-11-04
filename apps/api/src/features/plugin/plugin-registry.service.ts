import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NOTE_PLUGIN } from './plugin.interface';
import type { NotePlugin } from './plugin.interface';
import type { Note, NoteType } from '../note/entities/note.entity';
import type { NoteResponseDto } from '../note/dto/note-response.dto';
import { NoteService } from '../note/note.service';
import { toNoteResponseDto } from '../note/dto/note-response.dto';

/**
 * Holds the registry of all `NotePlugin` implementations (injected as a
 * multi-provider under the `NOTE_PLUGIN` token — see `PluginModule`), and
 * exposes operations to list the plugins applicable to a note type and to
 * execute a specific one against a note.
 */
@Injectable()
export class PluginRegistryService {
  constructor(
    @Inject(NOTE_PLUGIN) private readonly plugins: NotePlugin[],
    private readonly noteService: NoteService,
  ) { }

  /** Returns the plugins applicable to the given note type. */
  listForNoteType(noteType: NoteType): NotePlugin[] {
    return this.plugins.filter((plugin) => plugin.noteTypes.includes(noteType));
  }

  /** Returns all registered plugins. */
  listAllPlugins(): NotePlugin[] {
    return this.plugins;
  }

  /**
   * Returns the command that would be executed by the plugin for the given note.
   * Throws `NotFoundException` if no such plugin exists.
   */
  getCommand(plugin: NotePlugin, note: Note): string {
    return plugin.getCommand(note);
  }

  getPlugin(id: string) {
    return this.plugins.find((p) => p.id === id);
  }

  /**
   * Executes a plugin against a note and creates a new child note with the
   * plugin's preview as the title and its execution result as the content.
   */
  async execute(note: Note, plugin: NotePlugin) {
    const command = plugin.getCommand(note);

    const runCommand = async (cmd: string) => {
      try {
        const result = await plugin.execute(cmd);
        return result;
      } catch (error) {
        return `Command '${cmd}' failed\n\n${(error as Error).message}`;
      }
    };
    return await runCommand(command);
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
