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
import { NoteRelation } from './entities/note-relation.entity';
import { NoteLocation } from './entities/note-location.entity';
import { NoteLogEntry } from './entities/note-log-entry.entity';
import { parseNoteLocations } from './note-location.util';
import { getNoteLabel } from './note-label.util';
import { GeocodingService } from './geocoding.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNoteLogEntryDto } from './dto/create-note-log-entry.dto';
import { ProjectAccessService } from '../project/project-access.service';

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
const HISTORY_TRACKED_FIELDS = ['title', 'content', 'tags'] as const;

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
 * A geographic pin enriched with the owning note's derived display label and
 * tags, for consumers (e.g. controllers) that shouldn't need to separately
 * fetch the note to show a meaningful label/tags alongside each pin.
 * Represents either a real `NoteLocation` row (derived from `[[geo:...]]`
 * content tokens) or a synthetic pin derived from an `'address'`-type
 * note's resolved coordinates (see `buildAddressPin`) — the two are merged
 * into one flat list for map consumers, which don't need to distinguish
 * between them.
 */
export type NoteLocationWithLabel = {
  id: number;
  noteId: number;
  lat: number;
  lng: number;
  label: string | null;
  createdAt: Date;
  noteLabel: string;
  tags: string[];
};

/** The minimal shape of a `Note` needed to derive its synthetic address pin, if any. */
type AddressPinSource = Pick<
  Note,
  | 'id'
  | 'type'
  | 'latitude'
  | 'longitude'
  | 'geocodeStatus'
  | 'geocodedLabel'
  | 'createdAt'
>;

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(NoteHistoryEntry)
    private readonly noteHistoryRepository: Repository<NoteHistoryEntry>,
    @InjectRepository(NoteRelation)
    private readonly noteRelationRepository: Repository<NoteRelation>,
    @InjectRepository(NoteLocation)
    private readonly noteLocationRepository: Repository<NoteLocation>,
    @InjectRepository(NoteLogEntry)
    private readonly noteLogEntryRepository: Repository<NoteLogEntry>,
    private readonly projectAccessService: ProjectAccessService,
    private readonly geocodingService: GeocodingService,
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

  /**
   * Resolves an `'address'`-type note's `content` (the address text) to map
   * coordinates via `GeocodingService`, mutating `note` in place with the
   * outcome. Called whenever an address note is created or its `content` is
   * updated. Never throws — geocoding failures (no match, network error)
   * are recorded on the note (`geocodeStatus`/`geocodeError`) rather than
   * blocking the save, so a note is never lost just because its address
   * couldn't be resolved.
   */
  private async resolveAddressGeocode(note: Note): Promise<void> {
    const query = note.content?.trim();
    if (!query) {
      note.latitude = null;
      note.longitude = null;
      note.geocodeStatus = null;
      note.geocodedLabel = null;
      note.geocodeError = null;
      return;
    }

    try {
      const result = await this.geocodingService.resolve(query);
      if (!result) {
        note.latitude = null;
        note.longitude = null;
        note.geocodeStatus = 'failed';
        note.geocodedLabel = null;
        note.geocodeError = 'No matching location found for this address';
        return;
      }

      note.latitude = result.lat;
      note.longitude = result.lng;
      note.geocodeStatus = 'resolved';
      note.geocodedLabel = result.label;
      note.geocodeError = null;
    } catch (error) {
      note.latitude = null;
      note.longitude = null;
      note.geocodeStatus = 'failed';
      note.geocodedLabel = null;
      note.geocodeError =
        error instanceof Error ? error.message : 'Failed to resolve address';
    }
  }

  async create(projectId: number, createNoteDto: CreateNoteDto): Promise<Note> {
    await this.assertProjectExists(projectId);
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

    await this.syncLocations(savedNote.id, savedNote.content);

    if (savedNote.type === 'address') {
      await this.resolveAddressGeocode(savedNote);
      await this.noteRepository.save(savedNote);
    }

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

  /**
   * Derives a synthetic geographic pin from an `'address'`-type note's
   * resolved coordinates, or `null` if the note isn't an address note, its
   * address hasn't successfully resolved, or it's not this note's pin to
   * show. Uses a negative id (`-note.id`) so it can never collide with a
   * real, positively-numbered `NoteLocation` row when merged into the same
   * flat list of pins.
   */
  private buildAddressPin(
    note: AddressPinSource,
  ): Omit<NoteLocationWithLabel, 'noteLabel' | 'tags'> | null {
    if (note.type !== 'address') {
      return null;
    }
    if (
      note.geocodeStatus !== 'resolved' ||
      note.latitude == null ||
      note.longitude == null
    ) {
      return null;
    }
    return {
      id: -note.id,
      noteId: note.id,
      lat: note.latitude,
      lng: note.longitude,
      label: note.geocodedLabel,
      createdAt: note.createdAt,
    };
  }

  /**
   * Returns the geographic pins derived from a note's `[[geo:...]]` content
   * tokens, plus its synthetic address pin if it's a resolved `'address'`
   * note, or `null` if the note does not exist.
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
    const result: NoteLocationWithLabel[] = locations.map((location) => ({
      ...location,
      noteLabel,
      tags,
    }));

    const addressPin = this.buildAddressPin(note);
    if (addressPin) {
      result.push({ ...addressPin, noteLabel, tags });
    }

    return result;
  }

  /**
   * Returns every geographic pin derived from every active note's content
   * across the whole project — both `[[geo:...]]`-token pins and synthetic
   * pins for resolved `'address'`-type notes — each enriched with its
   * owning note's display label and tags. Used to power a project-wide map
   * view of all note locations.
   */
  async findAllLocations(projectId: number): Promise<NoteLocationWithLabel[]> {
    await this.assertProjectExists(projectId);

    const notes = await this.noteRepository.find({
      where: { projectId, deletedAt: IsNull() },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        type: true,
        latitude: true,
        longitude: true,
        geocodeStatus: true,
        geocodedLabel: true,
        createdAt: true,
      },
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

    const tokenPins = locations.map((location) => ({
      ...location,
      noteLabel: labelByNoteId.get(location.noteId) ?? 'Untitled note',
      tags: tagsByNoteId.get(location.noteId) ?? [],
    }));

    const addressPins = notes
      .map((note) => {
        const pin = this.buildAddressPin(note);
        if (!pin) {
          return null;
        }
        return {
          ...pin,
          noteLabel: labelByNoteId.get(note.id) ?? 'Untitled note',
          tags: tagsByNoteId.get(note.id) ?? [],
        };
      })
      .filter((pin): pin is NoteLocationWithLabel => pin !== null);

    return [...tokenPins, ...addressPins];
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

      // Only re-run geocoding when `content` actually changed value, not
      // merely because it was present in the request body — callers (e.g.
      // the frontend's title-autosave) may resend the unchanged `content`
      // alongside other field updates, and geocoding is an external network
      // call we don't want to redundantly repeat on every such save.
      const contentActuallyChanged = changes.some(
        (change) => change.field === 'content',
      );
      if (savedNote.type === 'address' && contentActuallyChanged) {
        await this.resolveAddressGeocode(savedNote);
        await this.noteRepository.save(savedNote);
      }
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
