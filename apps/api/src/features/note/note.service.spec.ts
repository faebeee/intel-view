import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { ProjectAccessService } from '../project/project-access.service';

describe('NoteService', () => {
  let service: NoteService;
  const mockNoteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockProjectAccessService = {
    assertExists: jest.fn(),
  };
  const mockNoteHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        {
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
        {
          provide: getRepositoryToken(NoteHistoryEntry),
          useValue: mockNoteHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);

    // Default: the project referenced by `projectId` always exists, so
    // tests only need to override this when specifically testing the
    // project-not-found path.
    mockProjectAccessService.assertExists.mockResolvedValue(undefined);

    // Default pass-through behavior for the history repository, so tests
    // that don't care about history assertions don't need to stub it.
    mockNoteHistoryRepository.create.mockImplementation(
      (entry: Partial<NoteHistoryEntry>) => entry,
    );
    mockNoteHistoryRepository.save.mockImplementation(
      (entry: Partial<NoteHistoryEntry>) => Promise.resolve(entry),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a note with an explicit type and config', async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'markdown' as const,
        content: 'hello world',
        config: { foo: 'bar' },
      };
      const createdNote = {
        id: 1,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        ...createNoteDto,
        projectId,
      });
      expect(mockNoteRepository.save).toHaveBeenCalledWith(createdNote);
      expect(result).toEqual(createdNote);
    });

    it('creates a note without a type, relying on the entity default', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'hello world' };
      const createdNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'hello world',
        config: null,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        ...createNoteDto,
        projectId,
      });
      expect(result.type).toBe('markdown');
    });

    it("records a 'created' history entry", async () => {
      const projectId = 1;
      const createNoteDto = { content: 'hello world' };
      const createdNote = {
        id: 7,
        projectId,
        type: 'markdown',
        content: 'hello world',
        config: null,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      await service.create(projectId, createNoteDto);

      expect(mockNoteHistoryRepository.create).toHaveBeenCalledWith({
        noteId: 7,
        changeType: 'created',
        changes: null,
      });
      expect(mockNoteHistoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates content and config without touching type', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'old content',
        config: null,
      } as unknown as Note;
      const updateNoteDto = {
        content: 'new content',
        config: { updated: true },
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.content).toBe('new content');
      expect(result?.config).toEqual({ updated: true });
      expect(result?.type).toBe('markdown');
    });

    it('records an updated history entry bundling all changed fields from one call', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'old content',
        config: null,
        tags: ['a'],
        lat: null,
        lng: null,
        parentId: null,
      } as unknown as Note;
      const updateNoteDto = {
        content: 'new content',
        tags: ['a', 'b'],
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockNoteHistoryRepository.create).toHaveBeenCalledWith({
        noteId: 1,
        changeType: 'updated',
        changes: [
          {
            field: 'content',
            previousValue: 'old content',
            newValue: 'new content',
          },
          { field: 'tags', previousValue: ['a'], newValue: ['a', 'b'] },
        ],
      });
    });

    it('does not record a history entry when no tracked field actually changes', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'same content',
        config: null,
      } as unknown as Note;
      const updateNoteDto = { content: 'same content' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockNoteHistoryRepository.create).not.toHaveBeenCalled();
      expect(mockNoteHistoryRepository.save).not.toHaveBeenCalled();
    });

    it('does not record canvasX/canvasY position changes in history', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'markdown',
        canvasX: 10,
        canvasY: 20,
      } as unknown as Note;
      const updateNoteDto = { canvasX: 99, canvasY: 100 };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockNoteHistoryRepository.create).not.toHaveBeenCalled();
    });

    it('does not wipe unspecified fields to null on a partial update (e.g. canvas-only drag)', async () => {
      // Regression test: `UpdateNoteDto` instances produced by the
      // ValidationPipe have every declared field present as an own
      // property (set to `undefined` when omitted from the request body),
      // due to `useDefineForClassFields` semantics. A naive
      // `Object.assign(note, updateNoteDto)` would therefore overwrite
      // every unspecified field with `undefined`/`NULL`, wiping the note's
      // content, tags, config, etc. on every canvas-position-only drag.
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'important content',
        config: { foo: 'bar' },
        tags: ['keep', 'me'],
        lat: 1.23,
        lng: 4.56,
        parentId: 7,
        canvasX: 10,
        canvasY: 20,
      } as unknown as Note;
      // Simulates a class-transformer-produced DTO instance where every
      // declared field is present as an own property, but only
      // canvasX/canvasY were actually supplied in the request body.
      const updateNoteDto = {
        content: undefined,
        config: undefined,
        tags: undefined,
        lat: undefined,
        lng: undefined,
        parentId: undefined,
        canvasX: 99,
        canvasY: 100,
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.content).toBe('important content');
      expect(result?.config).toEqual({ foo: 'bar' });
      expect(result?.tags).toEqual(['keep', 'me']);
      expect(result?.lat).toBe(1.23);
      expect(result?.lng).toBe(4.56);
      expect(result?.parentId).toBe(7);
      expect(result?.canvasX).toBe(99);
      expect(result?.canvasY).toBe(100);
    });
  });

  describe('findHistory', () => {
    it("returns a note's history ordered most-recent-first", async () => {
      const projectId = 1;
      const note = { id: 1, projectId } as Note;
      const entries = [{ id: 2 }, { id: 1 }] as NoteHistoryEntry[];

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteHistoryRepository.find.mockResolvedValue(entries);

      const result = await service.findHistory(projectId, 1);

      expect(mockNoteHistoryRepository.find).toHaveBeenCalledWith({
        where: { noteId: 1 },
        order: { createdAt: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual(entries);
    });

    it('returns null when the note does not exist', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.findHistory(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('addManualEntry', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('adds a manual entry to a log note', async () => {
      const projectId = 1;
      const logNote = { id: 1, projectId, type: 'log' } as Note;

      mockNoteRepository.findOne.mockResolvedValue(logNote);

      const result = await service.addManualEntry(projectId, 1, {
        content: 'Investigated the anomaly further.',
      });

      expect(mockNoteHistoryRepository.create).toHaveBeenCalledWith({
        noteId: 1,
        changeType: 'manual',
        changes: null,
        content: 'Investigated the anomaly further.',
      });
      expect(mockNoteHistoryRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        noteId: 1,
        changeType: 'manual',
        changes: null,
        content: 'Investigated the anomaly further.',
      });
    });

    it('rejects adding a manual entry to a non-log note', async () => {
      const projectId = 1;
      const markdownNote = { id: 1, projectId, type: 'markdown' } as Note;

      mockNoteRepository.findOne.mockResolvedValue(markdownNote);

      await expect(
        service.addManualEntry(projectId, 1, { content: 'nope' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns null when the note does not exist', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.addManualEntry(1, 999, {
        content: 'nope',
      });

      expect(result).toBeNull();
    });
  });

  describe('nesting (parentId)', () => {
    it('creates a note with a valid parentId', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'child note', parentId: 5 };
      const createdNote = {
        id: 10,
        projectId,
        content: 'child note',
        parentId: 5,
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue({
        id: 5,
        projectId,
        parentId: null,
      });
      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result.parentId).toBe(5);
    });

    it('rejects creating a note with a parentId from another project', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'child note', parentId: 5 };

      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.create(projectId, createNoteDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects a note being its own parent on update', async () => {
      const projectId = 1;
      const existingNote = { id: 1, projectId, parentId: null } as Note;

      mockNoteRepository.findOne
        .mockResolvedValueOnce(existingNote) // findOne for the note being updated
        .mockResolvedValueOnce(existingNote); // findOne for the note being updated

      await expect(
        service.update(projectId, 1, { parentId: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a circular parent relationship on update', async () => {
      const projectId = 1;
      // Hierarchy: note 1 (root) -> note 2 (child of 1). Attempt to set
      // note 1's parent to note 2, which would create a cycle.
      const note1 = { id: 1, projectId, parentId: null } as Note;
      const note2 = { id: 2, projectId, parentId: 1 } as Note;

      mockNoteRepository.findOne
        .mockResolvedValueOnce(note1) // the note being updated (id: 1)
        .mockResolvedValueOnce(note2); // the proposed parent (id: 2)
      mockNoteRepository.find.mockResolvedValue([note1, note2]);

      await expect(
        service.update(projectId, 1, { parentId: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('cascades soft-delete to all descendants', async () => {
      const projectId = 1;
      // Hierarchy: 1 -> 2 -> 3 (3 is grandchild of 1)
      const note1 = { id: 1, projectId, parentId: null } as Note;
      const note2 = { id: 2, projectId, parentId: 1 } as Note;
      const note3 = { id: 3, projectId, parentId: 2 } as Note;

      mockNoteRepository.findOne.mockResolvedValue(note1);
      mockNoteRepository.find.mockResolvedValue([note1, note2, note3]);
      mockNoteRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.remove(projectId, 1);

      expect(result).toBe(true);
      const [whereArg, updateArg] = mockNoteRepository.update.mock.calls[0] as [
        { projectId: number; id: { value: number[] } },
        { deletedAt: Date },
      ];
      expect(whereArg.projectId).toBe(projectId);
      expect(whereArg.id.value).toEqual(expect.arrayContaining([1, 2, 3]));
      expect(updateArg.deletedAt).toBeInstanceOf(Date);
    });
  });
});
