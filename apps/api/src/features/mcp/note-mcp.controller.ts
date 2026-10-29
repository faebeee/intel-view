import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { NoteService } from '../note/note.service';
import { NOTE_TYPES } from '../note/entities/note.entity';
import type { NoteType } from '../note/entities/note.entity';
import { toNoteResponseDto } from '../note/dto/note-response.dto';
import { toNoteHistoryEntryResponseDto } from '../note/dto/note-history-entry-response.dto';
import { toNoteLogEntryResponseDto } from '../note/dto/note-log-entry-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const projectIdField = z
  .number()
  .int()
  .describe('ID of the project the note belongs to');
const noteIdField = z.number().int().describe('ID of the note');

const createNoteParams = z.object({
  projectId: projectIdField,
  type: z
    .enum(NOTE_TYPES as [NoteType, ...NoteType[]])
    .optional()
    .describe(
      "The kind of note to create: 'standard' (freely-editable rich text), 'log' (append-only timestamped entries), 'url' (content must be a single well-formed URL), 'ip' (content must be a single well-formed IPv4 or IPv6 address), or 'file' (holds a single uploaded file, not settable via MCP). Defaults to 'standard'.",
    ),
  title: z.string().optional().describe('The title of the note'),
  content: z.string().optional().describe('The markdown content of the note'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional list of plain text tags associated with this note'),
  color: z
    .string()
    .nullish()
    .describe("Optional custom hex color (e.g. '#00f2ff') for this note"),
  parentIds: z
    .array(z.number().int())
    .optional()
    .describe(
      'IDs of the parent notes this note should be nested under, if any',
    ),
  canvasX: z
    .number()
    .nullish()
    .describe('X position to place this note at on the project canvas view'),
  canvasY: z
    .number()
    .nullish()
    .describe('Y position to place this note at on the project canvas view'),
});

const updateNoteParams = z.object({
  projectId: projectIdField,
  id: noteIdField,
  title: z.string().optional().describe('The title of the note'),
  content: z.string().optional().describe('The markdown content of the note'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Optional list of plain text tags associated with this note'),
  color: z
    .string()
    .nullish()
    .describe('Optional custom hex color for this note; pass null to clear'),
  canvasX: z
    .number()
    .nullish()
    .describe('X position to place this note at on the project canvas view'),
  canvasY: z
    .number()
    .nullish()
    .describe('Y position to place this note at on the project canvas view'),
});

const listNotesParams = z.object({
  projectId: projectIdField,
  page: z.number().int().optional().describe('Page number, 1-indexed'),
  limit: z.number().int().optional().describe('Number of items per page'),
  search: z
    .string()
    .optional()
    .describe('Free text search across title/content'),
});

const noteRefParams = z.object({
  projectId: projectIdField,
  id: noteIdField,
});

const noteRelationParams = z.object({
  projectId: projectIdField,
  id: noteIdField,
  relatedId: z.number().int().describe('ID of the related parent/child note'),
});

const createLogEntryParams = z.object({
  projectId: projectIdField,
  id: noteIdField,
  content: z.string().min(1).describe('Markdown content of the log entry'),
});

/**
 * Exposes note CRUD and relation/history/log operations as MCP
 * tools for AI agents, mirroring `NoteController`'s REST surface. File
 * upload/download tools are intentionally omitted — binary file transfer
 * doesn't map cleanly onto the MCP tool call/response shape.
 */
@McpController()
export class NoteMcpController {
  constructor(private readonly noteService: NoteService) {}

  @Tool({
    name: 'create_note',
    description: 'Create a new note in a project',
    parameters: createNoteParams,
  })
  async createNote(
    @Payload() { projectId, ...params }: z.infer<typeof createNoteParams>,
  ): Promise<McpToolTextResult> {
    const note = await this.noteService.create(projectId, params);
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'list_notes',
    description:
      'List active notes in a project with pagination and optional search',
    parameters: listNotesParams,
  })
  async listNotes(
    @Payload() { projectId, ...params }: z.infer<typeof listNotesParams>,
  ): Promise<McpToolTextResult> {
    const paginated = await this.noteService.findAll(
      projectId,
      buildMcpPaginateQuery(params),
    );
    return textResult({
      ...paginated,
      data: paginated.data.map(toNoteResponseDto),
    });
  }

  @Tool({
    name: 'get_note',
    description: 'Get a single note by ID within a project',
    parameters: noteRefParams,
  })
  async getNote(
    @Payload() { projectId, id }: z.infer<typeof noteRefParams>,
  ): Promise<McpToolTextResult> {
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'update_note',
    description: 'Update a note by ID within a project',
    parameters: updateNoteParams,
  })
  async updateNote(
    @Payload()
    { projectId, id, ...update }: z.infer<typeof updateNoteParams>,
  ): Promise<McpToolTextResult> {
    const note = await this.noteService.update(projectId, id, update);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'delete_note',
    description: 'Soft delete a note by ID within a project',
    parameters: noteRefParams,
  })
  async deleteNote(
    @Payload() { projectId, id }: z.infer<typeof noteRefParams>,
  ): Promise<McpToolTextResult> {
    const deleted = await this.noteService.remove(projectId, id);
    if (!deleted) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult({ message: `Note with ID ${id} successfully deleted` });
  }

  @Tool({
    name: 'add_note_parent',
    description:
      'Add another note as a parent of this note (notes may have multiple parents/children)',
    parameters: noteRelationParams,
  })
  async addNoteParent(
    @Payload()
    { projectId, id, relatedId }: z.infer<typeof noteRelationParams>,
  ): Promise<McpToolTextResult> {
    await this.noteService.addRelation(projectId, relatedId, id);
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'remove_note_parent',
    description: 'Remove a parent relation from this note',
    parameters: noteRelationParams,
  })
  async removeNoteParent(
    @Payload()
    { projectId, id, relatedId }: z.infer<typeof noteRelationParams>,
  ): Promise<McpToolTextResult> {
    await this.noteService.removeRelation(projectId, relatedId, id);
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'add_note_child',
    description:
      'Add another note as a child of this note (notes may have multiple parents/children)',
    parameters: noteRelationParams,
  })
  async addNoteChild(
    @Payload()
    { projectId, id, relatedId }: z.infer<typeof noteRelationParams>,
  ): Promise<McpToolTextResult> {
    await this.noteService.addRelation(projectId, id, relatedId);
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'remove_note_child',
    description: 'Remove a child relation from this note',
    parameters: noteRelationParams,
  })
  async removeNoteChild(
    @Payload()
    { projectId, id, relatedId }: z.infer<typeof noteRelationParams>,
  ): Promise<McpToolTextResult> {
    await this.noteService.removeRelation(projectId, id, relatedId);
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(toNoteResponseDto(note));
  }

  @Tool({
    name: 'get_note_history',
    description:
      'Get the full automatic change history of a note, most recent first',
    parameters: noteRefParams,
  })
  async getNoteHistory(
    @Payload() { projectId, id }: z.infer<typeof noteRefParams>,
  ): Promise<McpToolTextResult> {
    const history = await this.noteService.findHistory(projectId, id);
    if (!history) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(history.map(toNoteHistoryEntryResponseDto));
  }

  @Tool({
    name: 'create_note_log_entry',
    description:
      "Append a new entry to a 'log'-type note's log. Fails if the note isn't type 'log'.",
    parameters: createLogEntryParams,
  })
  async createNoteLogEntry(
    @Payload()
    { projectId, id, content }: z.infer<typeof createLogEntryParams>,
  ): Promise<McpToolTextResult> {
    const entry = await this.noteService.createLogEntry(projectId, id, {
      content,
    });
    return textResult(toNoteLogEntryResponseDto(entry));
  }

  @Tool({
    name: 'list_note_log_entries',
    description: "Get all of a 'log'-type note's entries, most recent first",
    parameters: noteRefParams,
  })
  async listNoteLogEntries(
    @Payload() { projectId, id }: z.infer<typeof noteRefParams>,
  ): Promise<McpToolTextResult> {
    const entries = await this.noteService.findLogEntries(projectId, id);
    if (!entries) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return textResult(entries.map(toNoteLogEntryResponseDto));
  }
}
