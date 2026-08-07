import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import type { NoteFieldChange } from './entities/note-history-entry.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNoteHistoryEntryDto } from './dto/create-note-history-entry.dto';
import { ProjectAccessService } from '../project/project-access.service';

export const notePaginateConfig: PaginateConfig<Note> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['content'],
  filterableColumns: {
    content: true,
    lat: true,
    lng: true,
    parentId: true,
  },
};

/**
 * Fields on `Note` that are tracked for automatic history entries when
 * changed via `update()`. Deliberately excludes `canvasX`/`canvasY`, since
 * dragging a note on the canvas view fires frequent position updates that
 * would flood the history with noise unrelated to the note's actual
 * content.
 */
const HISTORY_TRACKED_FIELDS = [
  'content',
  'config',
  'tags',
  'lat',
  'lng',
  'parentId',
] as const;

/**
 * Structurally compares two field values for equality, using JSON
 * serialization for objects/arrays (`config`, `tags`) and strict equality
 * for primitives.
 */
function valuesAreEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  if (typeof a === 'object' || typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteHistoryEntry)
    private readonly noteHistoryRepository: Repository<NoteHistoryEntry>,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  private async assertProjectExists(projectId: number): Promise<void> {
    await this.projectAccessService.assertExists(projectId);
  }

  /**
   * Validates that `parentId` refers to an existing, active note within the
   * same project, is not the note itself (`excludeId`), and does not create
   * a cycle in the note hierarchy.
   */
  private async assertParentValid(
    projectId: number,
    parentId: number,
    excludeId?: number,
  ): Promise<void> {
    if (parentId === excludeId) {
      throw new BadRequestException('A note cannot be its own parent');
    }

    const parent = await this.noteRepository.findOne({
      where: { id: parentId, projectId, deletedAt: IsNull() },
    });
    if (!parent) {
      throw new NotFoundException(
        `Parent note with ID ${parentId} not found in this project`,
      );
    }

    if (excludeId === undefined) {
      return;
    }

    // Walk up the ancestor chain of the proposed parent to ensure `excludeId`
    // (the note being created/updated) is not among its ancestors, which
    // would otherwise create a cycle.
    const allNotes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: { id: true, parentId: true },
    });
    const parentById = new Map(allNotes.map((n) => [n.id, n.parentId]));

    let currentId: number | null = parentId;
    const visited = new Set<number>();
    while (currentId !== null && currentId !== undefined) {
      if (currentId === excludeId) {
        throw new BadRequestException(
          'Cannot set parent: this would create a circular note hierarchy',
        );
      }
      if (visited.has(currentId)) {
        break;
      }
      visited.add(currentId);
      currentId = parentById.get(currentId) ?? null;
    }
  }

  /**
   * Collects the IDs of all descendants (children, grandchildren, etc.) of
   * `rootId` within the given project, based on active (non-deleted) notes.
   */
  private async getDescendantIds(
    projectId: number,
    rootId: number,
  ): Promise<number[]> {
    const allNotes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: { id: true, parentId: true },
    });

    const childrenByParent = new Map<number, number[]>();
    for (const n of allNotes) {
      if (n.parentId === null || n.parentId === undefined) continue;
      const siblings = childrenByParent.get(n.parentId) ?? [];
      siblings.push(n.id);
      childrenByParent.set(n.parentId, siblings);
    }

    const descendants: number[] = [];
    const queue: number[] = [...(childrenByParent.get(rootId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      descendants.push(id);
      const children = childrenByParent.get(id) ?? [];
      queue.push(...children);
    }

    return descendants;
  }

  async create(projectId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    await this.assertProjectExists(projectId);
    if (
      createNoteDto.parentId !== undefined &&
      createNoteDto.parentId !== null
    ) {
      await this.assertParentValid(projectId, createNoteDto.parentId);
    }
    const note = this.noteRepository.create({ ...createNoteDto, projectId });
    const savedNote = await this.noteRepository.save(note);

    await this.noteHistoryRepository.save(
      this.noteHistoryRepository.create({
        noteId: savedNote.id,
        changeType: 'created',
        changes: null,
      }),
    );

    return savedNote;
  }

  async findAll(
    projectId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Note>> {
    await this.assertProjectExists(projectId);
    return paginate(query, this.noteRepository, {
      ...notePaginateConfig,
      where: { deletedAt: IsNull(), projectId },
    });
  }

  async findOne(projectId: number, id: number): Promise<Note | null> {
    return this.noteRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });
  }

  /**
   * Returns the full, chronologically-ordered (most recent first) change
   * history of a note, or `null` if the note does not exist.
   */
  async findHistory(
    projectId: number,
    id: number,
  ): Promise<NoteHistoryEntry[] | null> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return null;
    }
    return this.noteHistoryRepository.find({
      where: { noteId: id },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }

  /**
   * Adds a freeform 'manual' history entry to a `log` note, added directly
   * by the user from the note detail view. Only supported for notes of
   * type `log` — other note types only ever accumulate automatic
   * 'created'/'updated' entries.
   */
  async addManualEntry(
    projectId: number,
    id: number,
    createNoteHistoryEntryDto: CreateNoteHistoryEntryDto,
  ): Promise<NoteHistoryEntry | null> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return null;
    }

    if (note.type !== 'log') {
      throw new BadRequestException(
        'Manual history entries can only be added to notes of type "log"',
      );
    }

    const entry = this.noteHistoryRepository.create({
      noteId: id,
      changeType: 'manual',
      changes: null,
      content: createNoteHistoryEntryDto.content,
    });
    return this.noteHistoryRepository.save(entry);
  }

  async update(
    projectId: number,
    id: number,
    updateNoteDto: UpdateNoteDto,
  ): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });

    if (!note) {
      return null;
    }

    if (
      updateNoteDto.parentId !== undefined &&
      updateNoteDto.parentId !== null
    ) {
      await this.assertParentValid(projectId, updateNoteDto.parentId, id);
    }

    // Compute field-level diffs for tracked fields before applying the
    // update, so we can record an automatic history entry for this edit.
    const changes: NoteFieldChange[] = [];
    for (const field of HISTORY_TRACKED_FIELDS) {
      if (!(field in updateNoteDto) || updateNoteDto[field] === undefined) {
        continue;
      }
      const previousValue = note[field];
      const newValue = updateNoteDto[field];
      if (!valuesAreEqual(previousValue, newValue)) {
        changes.push({ field, previousValue, newValue });
      }
    }

    // Update only the fields explicitly present in the request. `UpdateNoteDto`
    // instances have every declared field present as an own property (even
    // when omitted from the request body, class-transformer/TypeScript's
    // `useDefineForClassFields` semantics leave it as `undefined` rather than
    // absent) — a plain `Object.assign(note, updateNoteDto)` would therefore
    // overwrite every unspecified field on the note with `undefined` (which
    // TypeORM persists as `NULL`), silently wiping data on partial updates
    // like canvas-position-only drags. Only copy over properties that were
    // actually provided.
    for (const [key, value] of Object.entries(updateNoteDto)) {
      if (value !== undefined) {
        (note as unknown as Record<string, unknown>)[key] = value;
      }
    }

    note.updatedAt = new Date();
    const savedNote = await this.noteRepository.save(note);

    if (changes.length > 0) {
      await this.noteHistoryRepository.save(
        this.noteHistoryRepository.create({
          noteId: savedNote.id,
          changeType: 'updated',
          changes,
        }),
      );
    }

    return savedNote;
  }

  async remove(projectId: number, id: number): Promise<boolean> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return false;
    }
    const descendantIds = await this.getDescendantIds(projectId, id);
    const idsToDelete = [id, ...descendantIds];
    const result = await this.noteRepository.update(
      { id: In(idsToDelete), projectId },
      { deletedAt: new Date() },
    );
    return (result.affected ?? 0) > 0;
  }
}
