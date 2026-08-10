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
import { NoteLocation } from './entities/note-location.entity';
import { parseNoteLocations } from './note-location.util';
import { getNoteLabel } from './note-label.util';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ProjectAccessService } from '../project/project-access.service';

export const notePaginateConfig: PaginateConfig<Note> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['title', 'content'],
  filterableColumns: {
    title: true,
    content: true,
    parentId: true,
  },
};

/**
 * Fields on `Note` that are tracked for automatic history entries when
 * changed via `update()`.
 */
const HISTORY_TRACKED_FIELDS = [
  'title',
  'content',
  'tags',
  'parentId',
] as const;

/**
 * Structurally compares two field values for equality, using JSON
 * serialization for objects/arrays (`tags`) and strict equality for
 * primitives.
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

/**
 * A `NoteLocation` enriched with the owning note's derived display label and
 * tags, for consumers (e.g. controllers) that shouldn't need to separately
 * fetch the note to show a meaningful label/tags alongside each pin.
 */
export type NoteLocationWithLabel = NoteLocation & {
  noteLabel: string;
  tags: string[];
};

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteHistoryEntry)
    private readonly noteHistoryRepository: Repository<NoteHistoryEntry>,
    @InjectRepository(NoteLocation)
    private readonly noteLocationRepository: Repository<NoteLocation>,
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

  /**
   * Fully resyncs a note's `NoteLocation` rows from the `[[geo:...]]` tokens
   * found in its current `content`, deleting any previously derived rows and
   * recreating them from scratch. Called whenever a note is created or its
   * `content` is updated, so the table always reflects the note's latest
   * content without needing stable IDs round-tripped through markdown.
   */
  private async syncLocations(
    noteId: number,
    content: string | null,
  ): Promise<void> {
    await this.noteLocationRepository.delete({ noteId });
    const parsed = parseNoteLocations(content);
    if (parsed.length === 0) {
      return;
    }
    await this.noteLocationRepository.save(
      parsed.map((location) =>
        this.noteLocationRepository.create({ noteId, ...location }),
      ),
    );
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

    await this.syncLocations(savedNote.id, savedNote.content);

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
   * Returns the geographic pins derived from a note's `[[geo:...]]` content
   * tokens, or `null` if the note does not exist.
   */
  async findLocations(
    projectId: number,
    id: number,
  ): Promise<NoteLocationWithLabel[] | null> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return null;
    }
    const locations = await this.noteLocationRepository.find({
      where: { noteId: id },
      order: { id: 'ASC' },
    });
    const noteLabel = getNoteLabel(note);
    const tags = note.tags ?? [];
    return locations.map((location) => ({ ...location, noteLabel, tags }));
  }

  /**
   * Returns every geographic pin derived from every active note's content
   * across the whole project, each enriched with its owning note's display
   * label and tags. Used to power a project-wide map view of all note
   * locations.
   */
  async findAllLocations(projectId: number): Promise<NoteLocationWithLabel[]> {
    await this.assertProjectExists(projectId);

    const notes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: { id: true, title: true, content: true, tags: true },
    });
    if (notes.length === 0) {
      return [];
    }

    const noteIds = notes.map((note) => note.id);
    const locations = await this.noteLocationRepository.find({
      where: { noteId: In(noteIds) },
      order: { id: 'ASC' },
    });

    const labelByNoteId = new Map(
      notes.map((note) => [note.id, getNoteLabel(note)]),
    );
    const tagsByNoteId = new Map(
      notes.map((note) => [note.id, note.tags ?? []]),
    );
    return locations.map((location) => ({
      ...location,
      noteLabel: labelByNoteId.get(location.noteId) ?? 'Untitled note',
      tags: tagsByNoteId.get(location.noteId) ?? [],
    }));
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
    // TypeORM persists as `NULL`), silently wiping data on partial updates.
    // Only copy over properties that were actually provided.
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

    if (updateNoteDto.content !== undefined) {
      await this.syncLocations(savedNote.id, savedNote.content);
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
