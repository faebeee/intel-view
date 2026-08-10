import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { NoteLocation } from './entities/note-location.entity';
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
  const mockNoteLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
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
        {
          provide: getRepositoryToken(NoteLocation),
          useValue: mockNoteLocationRepository,
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

    // Default pass-through behavior for the location repository, so tests
    // that don't care about location sync don't need to stub it.
    mockNoteLocationRepository.create.mockImplementation(
      (location: Partial<NoteLocation>) => location,
    );
    mockNoteLocationRepository.save.mockImplementation((locations: unknown) =>
      Promise.resolve(locations),
    );
    mockNoteLocationRepository.delete.mockResolvedValue({ affected: 0 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a note with markdown content', async () => {
      const projectId = 1;
      const createNoteDto = {
        content: 'hello world',
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

    it("records a 'created' history entry", async () => {
      const projectId = 1;
      const createNoteDto = { content: 'hello world' };
      const createdNote = {
        id: 7,
        projectId,
        content: 'hello world',
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
    it('updates the content of a note', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        content: 'old content',
      } as unknown as Note;
      const updateNoteDto = {
        content: 'new content',
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.content).toBe('new content');
    });

    it('records an updated history entry bundling all changed fields from one call', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        content: 'old content',
        tags: ['a'],
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
        content: 'same content',
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

    it('does not wipe unspecified fields to null on a partial update', async () => {
      // Regression test: `UpdateNoteDto` instances produced by the
      // ValidationPipe have every declared field present as an own
      // property (set to `undefined` when omitted from the request body),
      // due to `useDefineForClassFields` semantics. A naive
      // `Object.assign(note, updateNoteDto)` would therefore overwrite
      // every unspecified field with `undefined`/`NULL`, wiping the note's
      // content, tags, etc. on every partial update.
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        content: 'important content',
        tags: ['keep', 'me'],
        parentId: 7,
      } as unknown as Note;
      // Simulates a class-transformer-produced DTO instance where every
      // declared field is present as an own property, but only `parentId`
      // was actually supplied in the request body.
      const updateNoteDto = {
        content: undefined,
        tags: undefined,
        parentId: 3,
      };

      mockNoteRepository.findOne
        .mockResolvedValueOnce(existingNote) // note being updated
        .mockResolvedValueOnce({ id: 3, projectId, parentId: null }); // new parent
      mockNoteRepository.find.mockResolvedValue([
        { id: 1, parentId: null },
        { id: 3, parentId: null },
      ]);

      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.content).toBe('important content');
      expect(result?.tags).toEqual(['keep', 'me']);
      expect(result?.parentId).toBe(3);
    });
  });

  describe('location syncing', () => {
    it('derives NoteLocation rows from [[geo:...]] tokens on create', async () => {
      const projectId = 1;
      const createNoteDto = {
        content: 'See [[geo:1.5,2.5,Home]] and [[geo:-3,4,]]',
      };
      const createdNote = {
        id: 7,
        projectId,
        content: createNoteDto.content,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      await service.create(projectId, createNoteDto);

      expect(mockNoteLocationRepository.delete).toHaveBeenCalledWith({
        noteId: 7,
      });
      expect(mockNoteLocationRepository.save).toHaveBeenCalledWith([
        { noteId: 7, lat: 1.5, lng: 2.5, label: 'Home' },
        { noteId: 7, lat: -3, lng: 4, label: null },
      ]);
    });

    it('resyncs NoteLocation rows when content is updated', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        content: '[[geo:1,1,Old]]',
      } as unknown as Note;
      const updateNoteDto = { content: '[[geo:2,2,New]]' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockNoteLocationRepository.delete).toHaveBeenCalledWith({
        noteId: 1,
      });
      expect(mockNoteLocationRepository.save).toHaveBeenCalledWith([
        { noteId: 1, lat: 2, lng: 2, label: 'New' },
      ]);
    });

    it('does not resync locations when content is not part of the update', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        content: '[[geo:1,1,Old]]',
        title: 'old title',
      } as unknown as Note;
      const updateNoteDto = { title: 'new title' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockNoteLocationRepository.delete).not.toHaveBeenCalled();
      expect(mockNoteLocationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findLocations', () => {
    it("returns a note's derived locations enriched with the note's label and tags", async () => {
      const projectId = 1;
      const note = {
        id: 1,
        projectId,
        title: 'My Trip',
        content: 'irrelevant',
        tags: ['travel', 'summer'],
      } as Note;
      const locations = [
        { id: 1, noteId: 1, lat: 1, lng: 1, label: null },
        { id: 2, noteId: 1, lat: 2, lng: 2, label: null },
      ] as NoteLocation[];

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteLocationRepository.find.mockResolvedValue(locations);

      const result = await service.findLocations(projectId, 1);

      expect(mockNoteLocationRepository.find).toHaveBeenCalledWith({
        where: { noteId: 1 },
        order: { id: 'ASC' },
      });
      expect(result).toEqual([
        { ...locations[0], noteLabel: 'My Trip', tags: ['travel', 'summer'] },
        { ...locations[1], noteLabel: 'My Trip', tags: ['travel', 'summer'] },
      ]);
    });

    it('defaults tags to an empty array when the note has none', async () => {
      const projectId = 1;
      const note = {
        id: 1,
        projectId,
        title: 'My Trip',
        content: 'irrelevant',
        tags: null,
      } as unknown as Note;
      const locations = [
        { id: 1, noteId: 1, lat: 1, lng: 1, label: null },
      ] as NoteLocation[];

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteLocationRepository.find.mockResolvedValue(locations);

      const result = await service.findLocations(projectId, 1);

      expect(result?.[0].tags).toEqual([]);
    });

    it('returns null when the note does not exist', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.findLocations(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findAllLocations', () => {
    it('returns every active note location in the project, enriched with each note label and tags', async () => {
      const projectId = 1;
      const notes = [
        { id: 1, title: 'Home', content: null, tags: ['family'] },
        {
          id: 2,
          title: null,
          content: 'Some long note content here',
          tags: null,
        },
      ] as unknown as Note[];
      const locations = [
        { id: 10, noteId: 1, lat: 1, lng: 1, label: null },
        { id: 11, noteId: 2, lat: 2, lng: 2, label: 'Office' },
      ] as NoteLocation[];

      mockNoteRepository.find.mockResolvedValue(notes);
      mockNoteLocationRepository.find.mockResolvedValue(locations);

      const result = await service.findAllLocations(projectId);

      expect(mockNoteRepository.find).toHaveBeenCalledWith({
        where: { projectId, deletedAt: IsNull() },
        select: { id: true, title: true, content: true, tags: true },
      });
      expect(mockNoteLocationRepository.find).toHaveBeenCalledWith({
        where: { noteId: In([1, 2]) },
        order: { id: 'ASC' },
      });
      expect(result).toEqual([
        { ...locations[0], noteLabel: 'Home', tags: ['family'] },
        {
          ...locations[1],
          noteLabel: 'Some long note content here',
          tags: [],
        },
      ]);
    });

    it('returns an empty array when the project has no notes', async () => {
      mockNoteRepository.find.mockResolvedValue([]);

      const result = await service.findAllLocations(1);

      expect(result).toEqual([]);
      expect(mockNoteLocationRepository.find).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockProjectAccessService.assertExists.mockRejectedValue(
        new NotFoundException('Project with ID 999 not found'),
      );

      await expect(service.findAllLocations(999)).rejects.toThrow(
        NotFoundException,
      );
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
