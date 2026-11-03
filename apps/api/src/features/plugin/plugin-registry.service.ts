import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NOTE_PLUGIN } from './plugin.interface';
import type { NotePlugin } from './plugin.interface';
import type { NoteType } from '../note/entities/note.entity';
import type { NoteResponseDto } from '../note/dto/note-response.dto';
import { NoteService } from '../note/note.service';
import { CreateNoteDto } from '../note/dto/create-note.dto';

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
  ) {}

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
  getCommand(pluginId: string, note: NoteResponseDto): string {
    const plugin = this.plugins.find((p) => p.id === pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin '${pluginId}' not found`);
    }
    return plugin.getCommand(note);
  }

  /**
   * Finds the plugin with the given `id` and executes it with the provided command.
   * Throws `NotFoundException` if no such plugin exists.
   */
  async execute(pluginId: string, command: string): Promise<string> {
    const plugin = this.plugins.find((p) => p.id === pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin '${pluginId}' not found`);
    }
    return plugin.execute(command);
  }

  /**
   * Executes a plugin against a note and creates a new child note with the
   * plugin's preview as the title and its execution result as the content.
   */
  async executeAndCreate(projectId: number, noteId: number, pluginId: string) {
    const note = await this.noteService.findOne(projectId, noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }

    const plugin = this.plugins.find((p) => p.id === pluginId);
    if (!plugin) {
      throw new NotFoundException(`Plugin '${pluginId}' not found`);
    }

    const noteDto = {
      id: note.id,
      projectId: note.projectId,
      type: note.type,
      title: note.title,
      content: note.content,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      tags: note.tags,
      color: note.color,
      parentIds: note.parentIds,
      childIds: note.childIds,
    };

    const title = await plugin.preview(noteDto);
    const command = plugin.getCommand(noteDto);
    const content = await plugin.execute(command);

    return this.noteService.create(projectId, {
      parentIds: [noteId],
      type: 'standard',
      title,
      content,
    } as CreateNoteDto);
  }

  /**
   * Finds the plugin with the given `id` that's applicable to `note`'s type
   * and runs it against `note`, returning its string result. Throws
   * `NotFoundException` if no such applicable plugin exists.
   */
  async preview(pluginId: string, note: NoteResponseDto): Promise<string> {
    const plugin = this.listForNoteType(note.type).find(
      (candidate) => candidate.id === pluginId,
    );
    if (!plugin) {
      throw new NotFoundException(
        `Plugin '${pluginId}' not found or not applicable to notes of type '${note.type}'`,
      );
    }
    return plugin.preview(note);
  }
}
