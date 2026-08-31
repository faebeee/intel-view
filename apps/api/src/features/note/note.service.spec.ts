import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In, IsNull } from 'typeorm';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { NoteRelation } from './entities/note-relation.entity';
import { NoteLocation } from './entities/note-location.entity';
import { NoteLogEntry } from './entities/note-log-entry.entity';
import { ProjectAccessService } from '../project/project-access.service';
import { GeocodingService } from './geocoding.service';
import { StorageService } from '../storage/storage.service';

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
  const mockNoteRelationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const mockNoteLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };
  const mockNoteLogEntryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockGeocodingService = {
    resolve: jest.fn(),
  };
  const mockStorageService = {
    buildNoteFileKey: jest.fn(),
    put: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
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
          provide: getRepositoryToken(NoteRelation),
          useValue: mockNoteRelationRepository,
        },
        {
          provide: getRepositoryToken(NoteLocation),
          useValue: mockNoteLocationRepository,
        },
        {
          provide: getRepositoryToken(NoteLogEntry),
          useValue: mockNoteLogEntryRepository,
        },
        {
          provide: GeocodingService,
          useValue: mockGeocodingService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
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

    // Default: no existing relations, so tests that don't care about
    // parent/child relations don't need to stub this repository.
    mockNoteRelationRepository.create.mockImplementation(
      (relation: Partial<NoteRelation>) => relation,
    );
    mockNoteRelationRepository.save.mockImplementation((relations: unknown) =>
      Promise.resolve(relations),
    );
    mockNoteRelationRepository.find.mockResolvedValue([]);
    mockNoteRelationRepository.findOne.mockResolvedValue(null);
    mockNoteRelationRepository.remove.mockResolvedValue(undefined);
    mockNoteRelationRepository.delete.mockResolvedValue({ affected: 0 });

    // Default pass-through behavior for the location repository, so tests
    // that don't care about location sync don't need to stub it.
    mockNoteLocationRepository.create.mockImplementation(
      (location: Partial<NoteLocation>) => location,
    );
    mockNoteLocationRepository.save.mockImplementation((locations: unknown) =>
      Promise.resolve(locations),
    );
    mockNoteLocationRepository.delete.mockResolvedValue({ affected: 0 });

    // Default pass-through behavior for the log entry repository, so tests
    // that don't care about log entries don't need to stub it.
    mockNoteLogEntryRepository.create.mockImplementation(
      (entry: Partial<NoteLogEntry>) => entry,
    );
    mockNoteLogEntryRepository.save.mockImplementation(
      (entry: Partial<NoteLogEntry>) => Promise.resolve(entry),
    );

    // Default: no geocoding stub set per-test unless overridden.
    mockGeocodingService.resolve.mockReset();

    // Default pass-through behavior for object storage, so file tests only
    // need to assert on the calls they care about.
    mockStorageService.buildNoteFileKey.mockReturnValue('stored/key');
    mockStorageService.put.mockResolvedValue(undefined);
    mockStorageService.remove.mockResolvedValue(undefined);
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

    it("updates a note's custom color and records it in history", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        color: null,
      } as unknown as Note;
      const updateNoteDto = { color: '#00f2ff' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.color).toBe('#00f2ff');
      expect(mockNoteHistoryRepository.create).toHaveBeenCalledWith({
        noteId: 1,
        changeType: 'updated',
        changes: [{ field: 'color', previousValue: null, newValue: '#00f2ff' }],
      });
    });

    it("clears a note's custom color by setting it to null", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        color: '#00f2ff',
      } as unknown as Note;
      const updateNoteDto = { color: null };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.color).toBeNull();
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
        canvasX: 1,
      } as unknown as Note;
      // Simulates a class-transformer-produced DTO instance where every
      // declared field is present as an own property, but only `canvasX`
      // was actually supplied in the request body.
      const updateNoteDto = {
        content: undefined,
        tags: undefined,
        canvasX: 42,
      };

      mockNoteRepository.findOne.mockResolvedValueOnce(existingNote); // note being updated

      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(result?.content).toBe('important content');
      expect(result?.tags).toEqual(['keep', 'me']);
      expect(result?.canvasX).toBe(42);
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

  describe('address geocoding', () => {
    it("resolves an 'address' note's content to coordinates on create", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'address' as const,
        content: '1 Infinite Loop',
      };
      const createdNote = {
        id: 7,
        projectId,
        type: 'address',
        content: '1 Infinite Loop',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );
      mockGeocodingService.resolve.mockResolvedValue({
        lat: 37.33,
        lng: -122.03,
        label: 'Apple Park, Cupertino, California, United States',
      });

      const result = await service.create(projectId, createNoteDto);

      expect(mockGeocodingService.resolve).toHaveBeenCalledWith(
        '1 Infinite Loop',
      );
      expect(result.latitude).toBe(37.33);
      expect(result.longitude).toBe(-122.03);
      expect(result.geocodeStatus).toBe('resolved');
      expect(result.geocodedLabel).toBe(
        'Apple Park, Cupertino, California, United States',
      );
      expect(result.geocodeError).toBeNull();
      // Saved twice: once for the initial create, once with the geocode result.
      expect(mockNoteRepository.save).toHaveBeenCalledTimes(2);
    });

    it('does not attempt to geocode non-address notes', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'hello world' };
      const createdNote = {
        id: 1,
        projectId,
        type: 'standard',
        content: 'hello world',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      await service.create(projectId, createNoteDto);

      expect(mockGeocodingService.resolve).not.toHaveBeenCalled();
    });

    it('records a failed status when no matching location is found', async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'address' as const,
        content: 'asdkjhaskjdh nowhere',
      };
      const createdNote = {
        id: 1,
        projectId,
        type: 'address',
        content: 'asdkjhaskjdh nowhere',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );
      mockGeocodingService.resolve.mockResolvedValue(null);

      const result = await service.create(projectId, createNoteDto);

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
      expect(result.geocodeStatus).toBe('failed');
      expect(result.geocodeError).toBeTruthy();
    });

    it('records a failed status (without throwing) when the geocoding request errors', async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'address' as const,
        content: '1 Infinite Loop',
      };
      const createdNote = {
        id: 1,
        projectId,
        type: 'address',
        content: '1 Infinite Loop',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );
      mockGeocodingService.resolve.mockRejectedValue(
        new Error('network unreachable'),
      );

      const result = await service.create(projectId, createNoteDto);

      expect(result.geocodeStatus).toBe('failed');
      expect(result.geocodeError).toBe('network unreachable');
    });

    it('re-resolves an address note when its content is updated', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'address',
        content: 'old address',
        latitude: 1,
        longitude: 1,
        geocodeStatus: 'resolved',
        geocodedLabel: 'Old Place',
        geocodeError: null,
      } as unknown as Note;
      const updateNoteDto = { content: 'new address' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );
      mockGeocodingService.resolve.mockResolvedValue({
        lat: 2,
        lng: 2,
        label: 'New Place',
      });

      const result = await service.update(projectId, 1, updateNoteDto);

      expect(mockGeocodingService.resolve).toHaveBeenCalledWith('new address');
      expect(result?.latitude).toBe(2);
      expect(result?.longitude).toBe(2);
      expect(result?.geocodedLabel).toBe('New Place');
    });

    it('does not re-resolve an address note when content is not part of the update', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'address',
        content: 'old address',
        title: 'old title',
      } as unknown as Note;
      const updateNoteDto = { title: 'new title' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockGeocodingService.resolve).not.toHaveBeenCalled();
    });

    it('does not re-resolve an address note when content is present but unchanged (e.g. a title-only autosave)', async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'address',
        content: 'same address',
        title: 'old title',
      } as unknown as Note;
      const updateNoteDto = { title: 'new title', content: 'same address' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await service.update(projectId, 1, updateNoteDto);

      expect(mockGeocodingService.resolve).not.toHaveBeenCalled();
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
        {
          ...locations[0],
          noteLabel: 'My Trip',
          tags: ['travel', 'summer'],
          color: null,
        },
        {
          ...locations[1],
          noteLabel: 'My Trip',
          tags: ['travel', 'summer'],
          color: null,
        },
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

    it("appends a synthetic pin for a resolved 'address'-type note", async () => {
      const projectId = 1;
      const note = {
        id: 5,
        projectId,
        title: 'HQ',
        content: '1 Infinite Loop',
        tags: ['work'],
        type: 'address',
        latitude: 37.33,
        longitude: -122.03,
        geocodeStatus: 'resolved',
        geocodedLabel: 'Apple Park, Cupertino',
        createdAt: new Date('2024-01-01'),
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteLocationRepository.find.mockResolvedValue([]);

      const result = await service.findLocations(projectId, 5);

      expect(result).toEqual([
        {
          id: -5,
          noteId: 5,
          lat: 37.33,
          lng: -122.03,
          label: 'Apple Park, Cupertino',
          createdAt: note.createdAt,
          noteLabel: 'HQ',
          tags: ['work'],
          color: null,
        },
      ]);
    });

    it("does not append a pin for an 'address'-type note that failed to geocode", async () => {
      const projectId = 1;
      const note = {
        id: 6,
        projectId,
        title: 'Nowhere',
        content: 'gibberish',
        tags: [],
        type: 'address',
        latitude: null,
        longitude: null,
        geocodeStatus: 'failed',
        geocodedLabel: null,
        createdAt: new Date('2024-01-02'),
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteLocationRepository.find.mockResolvedValue([]);

      const result = await service.findLocations(projectId, 6);

      expect(result).toEqual([]);
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
        select: {
          id: true,
          title: true,
          content: true,
          tags: true,
          color: true,
          type: true,
          latitude: true,
          longitude: true,
          geocodeStatus: true,
          geocodedLabel: true,
          createdAt: true,
        },
      });
      expect(mockNoteLocationRepository.find).toHaveBeenCalledWith({
        where: { noteId: In([1, 2]) },
        order: { id: 'ASC' },
      });
      expect(result).toEqual([
        { ...locations[0], noteLabel: 'Home', tags: ['family'], color: null },
        {
          ...locations[1],
          noteLabel: 'Some long note content here',
          tags: [],
          color: null,
        },
      ]);
    });

    it("includes a synthetic pin for each resolved 'address'-type note, alongside [[geo:...]] pins", async () => {
      const projectId = 1;
      const notes = [
        { id: 1, title: 'Home', content: null, tags: ['family'] },
        {
          id: 5,
          title: 'HQ',
          content: '1 Infinite Loop',
          tags: ['work'],
          type: 'address',
          latitude: 37.33,
          longitude: -122.03,
          geocodeStatus: 'resolved',
          geocodedLabel: 'Apple Park, Cupertino',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 6,
          title: 'Nowhere',
          content: 'gibberish',
          tags: [],
          type: 'address',
          latitude: null,
          longitude: null,
          geocodeStatus: 'failed',
          geocodedLabel: null,
          createdAt: new Date('2024-01-02'),
        },
      ] as unknown as Note[];
      const locations = [
        { id: 10, noteId: 1, lat: 1, lng: 1, label: null },
      ] as NoteLocation[];

      mockNoteRepository.find.mockResolvedValue(notes);
      mockNoteLocationRepository.find.mockResolvedValue(locations);

      const result = await service.findAllLocations(projectId);

      expect(result).toEqual([
        { ...locations[0], noteLabel: 'Home', tags: ['family'], color: null },
        {
          id: -5,
          noteId: 5,
          lat: 37.33,
          lng: -122.03,
          label: 'Apple Park, Cupertino',
          createdAt: notes[1].createdAt,
          noteLabel: 'HQ',
          tags: ['work'],
          color: null,
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

  describe('log entries', () => {
    it('appends a log entry to a log-type note', async () => {
      const projectId = 1;
      const note = { id: 1, projectId, type: 'log' } as Note;
      mockNoteRepository.findOne.mockResolvedValue(note);

      const result = await service.createLogEntry(projectId, 1, {
        content: 'did a thing',
      });

      expect(mockNoteLogEntryRepository.create).toHaveBeenCalledWith({
        noteId: 1,
        content: 'did a thing',
      });
      expect(result).toEqual({ noteId: 1, content: 'did a thing' });
    });

    it('rejects appending a log entry to a standard note', async () => {
      const projectId = 1;
      const note = { id: 1, projectId, type: 'standard' } as Note;
      mockNoteRepository.findOne.mockResolvedValue(note);

      await expect(
        service.createLogEntry(projectId, 1, { content: 'nope' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockNoteLogEntryRepository.save).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when appending to a non-existent note', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createLogEntry(1, 999, { content: 'nope' }),
      ).rejects.toThrow(NotFoundException);
    });

    it("returns a note's log entries ordered most-recent-first", async () => {
      const projectId = 1;
      const note = { id: 1, projectId, type: 'log' } as Note;
      const entries = [{ id: 2 }, { id: 1 }] as NoteLogEntry[];

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteLogEntryRepository.find.mockResolvedValue(entries);

      const result = await service.findLogEntries(projectId, 1);

      expect(mockNoteLogEntryRepository.find).toHaveBeenCalledWith({
        where: { noteId: 1 },
        order: { createdAt: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual(entries);
    });

    it('returns null when listing log entries for a non-existent note', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.findLogEntries(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('file notes', () => {
    const uploadedFile = {
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      size: 1234,
      buffer: Buffer.from('pdf bytes'),
    };

    it('stores an uploaded file and records it on the note', async () => {
      const projectId = 1;
      const note = {
        id: 3,
        projectId,
        type: 'file',
        fileKey: null,
        fileName: null,
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteRepository.save.mockImplementation((saved: Note) =>
        Promise.resolve(saved),
      );

      const result = await service.uploadFile(projectId, 3, uploadedFile);

      expect(mockStorageService.buildNoteFileKey).toHaveBeenCalledWith(
        projectId,
        3,
        'report.pdf',
      );
      expect(mockStorageService.put).toHaveBeenCalledWith('stored/key', {
        buffer: uploadedFile.buffer,
        size: 1234,
        mimeType: 'application/pdf',
      });
      expect(result.fileKey).toBe('stored/key');
      expect(result.fileName).toBe('report.pdf');
      expect(result.fileMimeType).toBe('application/pdf');
      expect(result.fileSize).toBe(1234);
    });

    it('deletes the previously stored object when a file is replaced', async () => {
      const note = {
        id: 3,
        projectId: 1,
        type: 'file',
        fileKey: 'old/key',
        fileName: 'old.pdf',
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteRepository.save.mockImplementation((saved: Note) =>
        Promise.resolve(saved),
      );

      await service.uploadFile(1, 3, uploadedFile);

      expect(mockStorageService.remove).toHaveBeenCalledWith('old/key');
    });

    it('rejects uploading a file to a note that is not a file note', async () => {
      mockNoteRepository.findOne.mockResolvedValue({
        id: 3,
        projectId: 1,
        type: 'standard',
      });

      await expect(service.uploadFile(1, 3, uploadedFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStorageService.put).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when uploading to a non-existent note', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.uploadFile(1, 999, uploadedFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("streams a file note's stored object with its metadata", async () => {
      const stream = { pipe: jest.fn() };
      mockNoteRepository.findOne.mockResolvedValue({
        id: 3,
        projectId: 1,
        type: 'file',
        fileKey: 'stored/key',
        fileName: 'report.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 1234,
      });
      mockStorageService.get.mockResolvedValue(stream);

      const result = await service.downloadFile(1, 3);

      expect(mockStorageService.get).toHaveBeenCalledWith('stored/key');
      expect(result).toEqual({
        stream,
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1234,
      });
    });

    it('throws NotFoundException when downloading a file note with no file', async () => {
      mockNoteRepository.findOne.mockResolvedValue({
        id: 3,
        projectId: 1,
        type: 'file',
        fileKey: null,
      });

      await expect(service.downloadFile(1, 3)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('clears the file metadata and deletes the object when removing a file', async () => {
      const note = {
        id: 3,
        projectId: 1,
        type: 'file',
        fileKey: 'stored/key',
        fileName: 'report.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 1234,
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteRepository.save.mockImplementation((saved: Note) =>
        Promise.resolve(saved),
      );

      const result = await service.removeFile(1, 3);

      expect(mockStorageService.remove).toHaveBeenCalledWith('stored/key');
      expect(result.fileKey).toBeNull();
      expect(result.fileName).toBeNull();
      expect(result.fileMimeType).toBeNull();
      expect(result.fileSize).toBeNull();
    });
  });

  describe('create with parentIds', () => {
    it('creates a note with valid parentIds and links them', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'child note', parentIds: [5] };
      const createdNote = {
        id: 10,
        projectId,
        content: 'child note',
      } as unknown as Note;

      mockNoteRepository.findOne.mockResolvedValue({
        id: 5,
        projectId,
      });
      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        content: 'child note',
        parentIds: [5],
        projectId,
      });
      expect(mockNoteRelationRepository.save).toHaveBeenCalledWith([
        { parentId: 5, childId: 10 },
      ]);
      expect(result.id).toBe(10);
    });

    it('rejects creating a note with a parentId from another project', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'child note', parentIds: [5] };

      mockNoteRepository.findOne.mockResolvedValue(null);

      await expect(service.create(projectId, createNoteDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addRelation / removeRelation', () => {
    it('adds a parent/child relation between two active notes', async () => {
      const projectId = 1;
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 1, projectId }) // parent
        .mockResolvedValueOnce({ id: 2, projectId }); // child
      mockNoteRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockNoteRelationRepository.find.mockResolvedValue([]);
      mockNoteRelationRepository.findOne.mockResolvedValue(null);

      await service.addRelation(projectId, 1, 2);

      expect(mockNoteRelationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 1, childId: 2 }),
      );
      expect(mockNoteHistoryRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          noteId: 2,
          changeType: 'link_added',
          relatedNoteId: 1,
          direction: 'parent',
        }),
        expect.objectContaining({
          noteId: 1,
          changeType: 'link_added',
          relatedNoteId: 2,
          direction: 'child',
        }),
      ]);
    });

    it('rejects linking a note to itself', async () => {
      await expect(service.addRelation(1, 5, 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects linking to a parent note from another project', async () => {
      mockNoteRepository.findOne
        .mockResolvedValueOnce(null) // parent not found in this project
        .mockResolvedValueOnce({ id: 2, projectId: 1 });

      await expect(service.addRelation(1, 99, 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects a relation that already exists', async () => {
      const projectId = 1;
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 1, projectId })
        .mockResolvedValueOnce({ id: 2, projectId });
      mockNoteRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockNoteRelationRepository.find.mockResolvedValue([]);
      mockNoteRelationRepository.findOne.mockResolvedValue({
        id: 1,
        parentId: 1,
        childId: 2,
      });

      await expect(service.addRelation(projectId, 1, 2)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a relation that would create a circular note graph', async () => {
      const projectId = 1;
      // Existing relation: 1 -> 2 (1 is parent of 2). Attempting to add
      // 2 -> 1 (making 2 the parent of 1) would create a cycle.
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 2, projectId }) // proposed parent
        .mockResolvedValueOnce({ id: 1, projectId }); // proposed child
      mockNoteRepository.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockNoteRelationRepository.find.mockResolvedValue([
        { parentId: 1, childId: 2 },
      ]);

      await expect(service.addRelation(projectId, 2, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows a note to have multiple parents (not a cycle)', async () => {
      const projectId = 1;
      // Existing relation: 1 -> 3. Adding 2 -> 3 gives note 3 two parents,
      // which is valid in a DAG (not a cycle).
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 2, projectId })
        .mockResolvedValueOnce({ id: 3, projectId });
      mockNoteRepository.find.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      mockNoteRelationRepository.find.mockResolvedValue([
        { parentId: 1, childId: 3 },
      ]);
      mockNoteRelationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addRelation(projectId, 2, 3),
      ).resolves.toBeUndefined();
      expect(mockNoteRelationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ parentId: 2, childId: 3 }),
      );
    });

    it('removes an existing relation', async () => {
      const projectId = 1;
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 1, projectId })
        .mockResolvedValueOnce({ id: 2, projectId });
      mockNoteRelationRepository.findOne.mockResolvedValue({
        id: 1,
        parentId: 1,
        childId: 2,
      });

      await service.removeRelation(projectId, 1, 2);

      expect(mockNoteRelationRepository.remove).toHaveBeenCalledWith({
        id: 1,
        parentId: 1,
        childId: 2,
      });
      expect(mockNoteHistoryRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          noteId: 2,
          changeType: 'link_removed',
          relatedNoteId: 1,
          direction: 'parent',
        }),
        expect.objectContaining({
          noteId: 1,
          changeType: 'link_removed',
          relatedNoteId: 2,
          direction: 'child',
        }),
      ]);
    });

    it('throws NotFoundException when removing a relation that does not exist', async () => {
      const projectId = 1;
      mockNoteRepository.findOne
        .mockResolvedValueOnce({ id: 1, projectId })
        .mockResolvedValueOnce({ id: 2, projectId });
      mockNoteRelationRepository.findOne.mockResolvedValue(null);

      await expect(service.removeRelation(projectId, 1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes only the note itself, without cascading to children', async () => {
      const projectId = 1;
      const note = { id: 1, projectId } as Note;

      mockNoteRepository.findOne.mockResolvedValue(note);
      mockNoteRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.remove(projectId, 1);

      expect(result).toBe(true);
      const [whereArg, updateArg] = mockNoteRepository.update.mock.calls[0] as [
        { id: number; projectId: number },
        { deletedAt: Date },
      ];
      expect(whereArg).toEqual({ id: 1, projectId });
      expect(updateArg.deletedAt).toBeInstanceOf(Date);
      expect(mockNoteRelationRepository.delete).toHaveBeenCalledWith({
        parentId: 1,
      });
      expect(mockNoteRelationRepository.delete).toHaveBeenCalledWith({
        childId: 1,
      });
    });

    it('returns false when the note does not exist', async () => {
      mockNoteRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(1, 999);

      expect(result).toBe(false);
      expect(mockNoteRepository.update).not.toHaveBeenCalled();
    });
  });
});
