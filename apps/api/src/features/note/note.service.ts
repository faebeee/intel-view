import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { isIP } from 'node:net';
import {
  paginate,
  PaginateQuery,
  Paginated,
  PaginateConfig,
} from 'nestjs-paginate';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import type { NoteFieldChange } from './entities/note-history-entry.entity';
import { NoteRelation } from './entities/note-relation.entity';
import { NoteLogEntry } from './entities/note-log-entry.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNoteLogEntryDto } from './dto/create-note-log-entry.dto';
import { ProjectAccessService } from '../project/project-access.service';
import { StorageService } from '../storage/storage.service';
import type { Readable } from 'stream';

export const notePaginateConfig: PaginateConfig<Note> = {
  sortableColumns: ['id', 'createdAt', 'updatedAt'],
  nullSort: 'last',
  defaultSortBy: [['id', 'DESC']],
  searchableColumns: ['title', 'content'],
  filterableColumns: {
    title: true,
    content: true,
  },
};

/**
 * Fields on `Note` that are tracked for automatic history entries when
 * changed via `update()`. Parent/child relations are tracked separately as
 * dedicated `'link_added'`/`'link_removed'` history entries (see
 * `addRelation`/`removeRelation`), since they're no longer a plain column.
 */
const HISTORY_TRACKED_FIELDS = ['title', 'content', 'tags', 'color'] as const;

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
 * The parts of a multipart upload the service needs to persist a note's
 * file. Structurally compatible with `Express.Multer.File` (the controller
 * passes one straight through), but declared here so the service layer
 * doesn't depend on the HTTP layer's types.
 */
export type UploadedNoteFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteHistoryEntry)
    private readonly noteHistoryRepository: Repository<NoteHistoryEntry>,
    @InjectRepository(NoteRelation)
    private readonly noteRelationRepository: Repository<NoteRelation>,
    @InjectRepository(NoteLogEntry)
    private readonly noteLogEntryRepository: Repository<NoteLogEntry>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly storageService: StorageService,
  ) {}

  private async assertProjectExists(projectId: number): Promise<void> {
    await this.projectAccessService.assertExists(projectId);
  }

  /**
   * Validates that `parentId` refers to an existing, active note within the
   * same project as `childId`, that they aren't the same note, and that
   * linking them wouldn't create a cycle in the note relation graph (a DAG,
   * since a note may have multiple parents/children). Does not check
   * whether the relation already exists — callers should check that
   * separately where relevant (e.g. `addRelation`).
   */
  private async assertLinkValid(
    projectId: number,
    parentId: number,
    childId: number,
  ): Promise<void> {
    if (parentId === childId) {
      throw new BadRequestException('A note cannot be linked to itself');
    }

    const [parent, child] = await Promise.all([
      this.noteRepository.findOne({
        where: { id: parentId, projectId, deletedAt: IsNull() },
      }),
      this.noteRepository.findOne({
        where: { id: childId, projectId, deletedAt: IsNull() },
      }),
    ]);
    if (!parent) {
      throw new NotFoundException(
        `Parent note with ID ${parentId} not found in this project`,
      );
    }
    if (!child) {
      throw new NotFoundException(
        `Child note with ID ${childId} not found in this project`,
      );
    }

    // Adding parentId -> childId would create a cycle if parentId is
    // already reachable by walking down from childId through its existing
    // descendants (i.e. parentId is already a descendant of childId).
    const descendantIds = await this.getDescendantIds(projectId, childId);
    if (descendantIds.includes(parentId)) {
      throw new BadRequestException(
        'Cannot add this relation: it would create a circular note hierarchy',
      );
    }
  }

  /**
   * Collects the IDs of all descendants (children, grandchildren, etc.) of
   * `rootId` within the given project, based on active (non-deleted) notes'
   * `NoteRelation` rows. Since a note may have multiple parents, the same
   * descendant may be reachable via multiple paths — each is only visited
   * (and included) once.
   */
  private async getDescendantIds(
    projectId: number,
    rootId: number,
  ): Promise<number[]> {
    const activeNoteIds = new Set(
      (
        await this.noteRepository.find({
          where: { projectId, deletedAt: IsNull() },
          select: { id: true },
        })
      ).map((n) => n.id),
    );

    const relations = await this.noteRelationRepository.find({
      where: [
        { parentId: In([...activeNoteIds]) },
        { childId: In([...activeNoteIds]) },
      ],
    });

    const childrenByParent = new Map<number, number[]>();
    for (const relation of relations) {
      if (
        !activeNoteIds.has(relation.parentId) ||
        !activeNoteIds.has(relation.childId)
      ) {
        continue;
      }
      const siblings = childrenByParent.get(relation.parentId) ?? [];
      siblings.push(relation.childId);
      childrenByParent.set(relation.parentId, siblings);
    }

    const descendants: number[] = [];
    const visited = new Set<number>();
    const queue: number[] = [...(childrenByParent.get(rootId) ?? [])];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      descendants.push(id);
      const children = childrenByParent.get(id) ?? [];
      queue.push(...children);
    }

    return descendants;
  }

  /**
   * Populates the transient `parentIds`/`childIds` properties on each given
   * note (mutating in place) from the current `NoteRelation` rows, so
   * `toNoteResponseDto` can include them without a separate request per
   * note.
   */
  private async attachRelationIds(notes: Note[]): Promise<void> {
    if (notes.length === 0) return;
    const ids = notes.map((n) => n.id);
    const relations = await this.noteRelationRepository.find({
      where: [{ parentId: In(ids) }, { childId: In(ids) }],
    });

    const parentIdsByChild = new Map<number, number[]>();
    const childIdsByParent = new Map<number, number[]>();
    for (const relation of relations) {
      const parents = parentIdsByChild.get(relation.childId) ?? [];
      parents.push(relation.parentId);
      parentIdsByChild.set(relation.childId, parents);

      const children = childIdsByParent.get(relation.parentId) ?? [];
      children.push(relation.childId);
      childIdsByParent.set(relation.parentId, children);
    }

    for (const note of notes) {
      note.parentIds = parentIdsByChild.get(note.id) ?? [];
      note.childIds = childIdsByParent.get(note.id) ?? [];
    }
  }

  /**
   * Adds a directed parent -> child relation between two notes in the same
   * project, after validating it (existence, not self-linked, no cycle) and
   * that it doesn't already exist. Records a `'link_added'` history entry on
   * both notes.
   */
  async addRelation(
    projectId: number,
    parentId: number,
    childId: number,
  ): Promise<void> {
    await this.assertLinkValid(projectId, parentId, childId);

    const existing = await this.noteRelationRepository.findOne({
      where: { parentId, childId },
    });
    if (existing) {
      throw new BadRequestException('This relation already exists');
    }

    await this.noteRelationRepository.save(
      this.noteRelationRepository.create({ parentId, childId }),
    );

    await this.noteHistoryRepository.save([
      this.noteHistoryRepository.create({
        noteId: childId,
        changeType: 'link_added',
        changes: null,
        relatedNoteId: parentId,
        direction: 'parent',
      }),
      this.noteHistoryRepository.create({
        noteId: parentId,
        changeType: 'link_added',
        changes: null,
        relatedNoteId: childId,
        direction: 'child',
      }),
    ]);
  }

  /**
   * Removes a directed parent -> child relation between two notes, if it
   * exists. Records a `'link_removed'` history entry on both notes.
   * Throws `NotFoundException` if either note doesn't exist in the project,
   * or if the relation doesn't exist.
   */
  async removeRelation(
    projectId: number,
    parentId: number,
    childId: number,
  ): Promise<void> {
    const [parent, child] = await Promise.all([
      this.findOne(projectId, parentId),
      this.findOne(projectId, childId),
    ]);
    if (!parent) {
      throw new NotFoundException(
        `Parent note with ID ${parentId} not found in this project`,
      );
    }
    if (!child) {
      throw new NotFoundException(
        `Child note with ID ${childId} not found in this project`,
      );
    }

    const existing = await this.noteRelationRepository.findOne({
      where: { parentId, childId },
    });
    if (!existing) {
      throw new NotFoundException('This relation does not exist');
    }
    await this.noteRelationRepository.remove(existing);

    await this.noteHistoryRepository.save([
      this.noteHistoryRepository.create({
        noteId: childId,
        changeType: 'link_removed',
        changes: null,
        relatedNoteId: parentId,
        direction: 'parent',
      }),
      this.noteHistoryRepository.create({
        noteId: parentId,
        changeType: 'link_removed',
        changes: null,
        relatedNoteId: childId,
        direction: 'child',
      }),
    ]);
  }

  /**
   * Validates that `content` is a well-formed `http(s)://` URL, throwing a
   * `BadRequestException` if not. Only applicable to `'url'`-type notes,
   * for which `content` holds the URL itself rather than freeform text.
   * Empty/null content is allowed (a url note can be created without a
   * URL set yet) and is simply skipped.
   */
  private assertValidUrlContent(content: string | null | undefined): void {
    const trimmed = content?.trim();
    if (!trimmed) {
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new BadRequestException(`'${trimmed}' is not a valid URL`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(
        `'${trimmed}' must use the http or https protocol`,
      );
    }
  }

  /**
   * Validates that `content` is a well-formed IPv4 or IPv6 address, throwing
   * a `BadRequestException` if not. Only applicable to `'ip'`-type notes.
   * Empty/null content is allowed (an ip note can be created without an
   * address set yet) and is simply skipped.
   */
  private assertValidIpContent(content: string | null | undefined): void {
    const trimmed = content?.trim();
    if (!trimmed) {
      return;
    }

    if (isIP(trimmed) === 0) {
      throw new BadRequestException(
        `'${trimmed}' is not a valid IPv4 or IPv6 address`,
      );
    }
  }

  async create(projectId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    await this.assertProjectExists(projectId);

    if (createNoteDto.type === 'url') {
      this.assertValidUrlContent(createNoteDto.content);
    }

    if (createNoteDto.type === 'ip') {
      this.assertValidIpContent(createNoteDto.content);
    }

    const parentIds = createNoteDto.parentIds ?? [];
    for (const parentId of parentIds) {
      const parent = await this.noteRepository.findOne({
        where: { id: parentId, projectId, deletedAt: IsNull() },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent note with ID ${parentId} not found in this project`,
        );
      }
    }

    const note = this.noteRepository.create({ ...createNoteDto, projectId });
    const savedNote = await this.noteRepository.save(note);

    if (parentIds.length > 0) {
      await this.noteRelationRepository.save(
        parentIds.map((parentId) =>
          this.noteRelationRepository.create({
            parentId,
            childId: savedNote.id,
          }),
        ),
      );
    }

    await this.noteHistoryRepository.save(
      this.noteHistoryRepository.create({
        noteId: savedNote.id,
        changeType: 'created',
        changes: null,
      }),
    );

    await this.attachRelationIds([savedNote]);

    return savedNote;
  }

  async findAll(
    projectId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Note>> {
    await this.assertProjectExists(projectId);
    const paginated = await paginate(query, this.noteRepository, {
      ...notePaginateConfig,
      where: { deletedAt: IsNull(), projectId },
    });
    await this.attachRelationIds(paginated.data);
    return paginated;
  }

  async findOne(projectId: number, id: number): Promise<Note | null> {
    const note = await this.noteRepository.findOne({
      where: { id, projectId, deletedAt: IsNull() },
    });
    if (!note) return null;
    await this.attachRelationIds([note]);
    return note;
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
   * Appends a new, immutable log entry to a `'log'`-type note. Throws if the
   * note doesn't exist or isn't a log note — log entries are only a valid
   * concept for that note type.
   */
  async createLogEntry(
    projectId: number,
    id: number,
    createNoteLogEntryDto: CreateNoteLogEntryDto,
  ): Promise<NoteLogEntry> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    if (note.type !== 'log') {
      throw new BadRequestException(
        'Log entries can only be added to notes of type "log"',
      );
    }

    return this.noteLogEntryRepository.save(
      this.noteLogEntryRepository.create({
        noteId: id,
        content: createNoteLogEntryDto.content,
      }),
    );
  }

  /**
   * Loads a `'file'`-type note, throwing if it doesn't exist or is of any
   * other type — file attachments are only a valid concept for that type.
   */
  private async findFileNote(projectId: number, id: number): Promise<Note> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    if (note.type !== 'file') {
      throw new BadRequestException(
        'Files can only be attached to notes of type "file"',
      );
    }
    return note;
  }

  /**
   * Stores an uploaded file for a `'file'`-type note, replacing (and
   * deleting) any file previously attached to it, and records an `'updated'`
   * history entry describing the swap. The bytes live in object storage; the
   * note only keeps the key and the file's metadata.
   */
  async uploadFile(
    projectId: number,
    id: number,
    file: UploadedNoteFile,
  ): Promise<Note> {
    const note = await this.findFileNote(projectId, id);
    const previousKey = note.fileKey;
    const previousName = note.fileName;

    const key = this.storageService.buildNoteFileKey(
      projectId,
      id,
      file.originalname,
    );
    await this.storageService.put(key, {
      buffer: file.buffer,
      size: file.size,
      mimeType: file.mimetype,
    });

    note.fileKey = key;
    note.fileName = file.originalname;
    note.fileMimeType = file.mimetype;
    note.fileSize = file.size;
    note.updatedAt = new Date();
    const savedNote = await this.noteRepository.save(note);

    if (previousKey) {
      await this.removeStoredObject(previousKey);
    }

    await this.noteHistoryRepository.save(
      this.noteHistoryRepository.create({
        noteId: savedNote.id,
        changeType: 'updated',
        changes: [
          {
            field: 'fileName',
            previousValue: previousName,
            newValue: file.originalname,
          },
        ],
      }),
    );

    await this.attachRelationIds([savedNote]);
    return savedNote;
  }

  /**
   * Returns a readable stream of a file note's stored bytes along with the
   * metadata needed to serve it (name, MIME type, size). Throws if the note
   * isn't a file note or has no file attached yet.
   */
  async downloadFile(
    projectId: number,
    id: number,
  ): Promise<{
    stream: Readable;
    fileName: string;
    mimeType: string;
    size: number | null;
  }> {
    const note = await this.findFileNote(projectId, id);
    if (!note.fileKey) {
      throw new NotFoundException(`Note with ID ${id} has no file attached`);
    }
    return {
      stream: await this.storageService.get(note.fileKey),
      fileName: note.fileName ?? `note-${id}`,
      mimeType: note.fileMimeType ?? 'application/octet-stream',
      size: note.fileSize,
    };
  }

  /**
   * Detaches a file note's file, deleting the stored object and clearing the
   * note's file metadata. The note itself is kept, ready for a new upload.
   */
  async removeFile(projectId: number, id: number): Promise<Note> {
    const note = await this.findFileNote(projectId, id);
    if (!note.fileKey) {
      throw new NotFoundException(`Note with ID ${id} has no file attached`);
    }

    const previousKey = note.fileKey;
    const previousName = note.fileName;
    note.fileKey = null;
    note.fileName = null;
    note.fileMimeType = null;
    note.fileSize = null;
    note.updatedAt = new Date();
    const savedNote = await this.noteRepository.save(note);

    await this.removeStoredObject(previousKey);

    await this.noteHistoryRepository.save(
      this.noteHistoryRepository.create({
        noteId: savedNote.id,
        changeType: 'updated',
        changes: [
          {
            field: 'fileName',
            previousValue: previousName,
            newValue: null,
          },
        ],
      }),
    );

    await this.attachRelationIds([savedNote]);
    return savedNote;
  }

  /**
   * Deletes an object from storage, swallowing failures: an orphaned object
   * is preferable to failing a request whose database state has already been
   * updated to no longer reference it.
   */
  private async removeStoredObject(key: string): Promise<void> {
    try {
      await this.storageService.remove(key);
    } catch {
      // Intentionally ignored — see doc comment.
    }
  }

  /**
   * Returns every log entry recorded for a note, most recent first, or
   * `null` if the note does not exist.
   */
  async findLogEntries(
    projectId: number,
    id: number,
  ): Promise<NoteLogEntry[] | null> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return null;
    }
    return this.noteLogEntryRepository.find({
      where: { noteId: id },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
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
      note.type === 'url' &&
      updateNoteDto.content !== undefined &&
      !valuesAreEqual(note.content, updateNoteDto.content)
    ) {
      this.assertValidUrlContent(updateNoteDto.content);
    }

    if (
      note.type === 'ip' &&
      updateNoteDto.content !== undefined &&
      !valuesAreEqual(note.content, updateNoteDto.content)
    ) {
      this.assertValidIpContent(updateNoteDto.content);
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

    await this.attachRelationIds([savedNote]);

    return savedNote;
  }

  /**
   * Soft-deletes a single note. Does not cascade to its children — since a
   * note may have multiple parents, a child note may still be reachable
   * through another parent after this one is deleted, so its lifecycle is
   * left independent. Only this note's own `NoteRelation` rows (as either
   * parent or child) are cleaned up.
   */
  async remove(projectId: number, id: number): Promise<boolean> {
    const note = await this.findOne(projectId, id);
    if (!note) {
      return false;
    }
    const result = await this.noteRepository.update(
      { id, projectId },
      { deletedAt: new Date() },
    );
    await this.noteRelationRepository.delete({ parentId: id });
    await this.noteRelationRepository.delete({ childId: id });
    return (result.affected ?? 0) > 0;
  }
}
