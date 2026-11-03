import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { NoteHistoryEntry } from './entities/note-history-entry.entity';
import { NoteRelation } from './entities/note-relation.entity';
import { NoteLogEntry } from './entities/note-log-entry.entity';
import { ProjectAccessService } from '../project/project-access.service';
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
  const mockNoteLogEntryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
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
          provide: getRepositoryToken(NoteLogEntry),
          useValue: mockNoteLogEntryRepository,
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

    // Default pass-through behavior for the log entry repository, so tests
    // that don't care about log entries don't need to stub it.
    mockNoteLogEntryRepository.create.mockImplementation(
      (entry: Partial<NoteLogEntry>) => entry,
    );
    mockNoteLogEntryRepository.save.mockImplementation(
      (entry: Partial<NoteLogEntry>) => Promise.resolve(entry),
    );

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

  describe('url validation', () => {
    it("creates a 'url' note with a well-formed URL", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'url' as const,
        content: 'https://example.com/page',
      };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("allows creating a 'url' note with empty content", async () => {
      const projectId = 1;
      const createNoteDto = { type: 'url' as const, content: '' };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("allows creating a 'url' note with null content", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'url' as const,
        content: null as unknown as string,
      };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("rejects creating a 'url' note with a malformed URL", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'url' as const,
        content: 'not a url',
      };

      await expect(service.create(projectId, createNoteDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteRepository.create).not.toHaveBeenCalled();
    });

    it("rejects creating a 'url' note whose content uses a non-http(s) protocol", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'url' as const,
        content: 'ftp://example.com/file',
      };

      await expect(service.create(projectId, createNoteDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteRepository.create).not.toHaveBeenCalled();
    });

    it("does not validate content as a URL for non-'url' note types", async () => {
      const projectId = 1;
      const createNoteDto = { content: 'not a url' };
      const createdNote = {
        id: 1,
        projectId,
        type: 'standard',
        content: 'not a url',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      await expect(service.create(projectId, createNoteDto)).resolves.toEqual(
        createdNote,
      );
    });

    it("re-validates a 'url' note's content when it is updated", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'url',
        content: 'https://old.example.com',
      } as unknown as Note;
      const updateNoteDto = { content: 'not a url' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);

      await expect(service.update(projectId, 1, updateNoteDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteRepository.save).not.toHaveBeenCalled();
    });

    it("does not re-validate a 'url' note's content when it is unchanged", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'url',
        content: 'https://same.example.com',
        title: 'old title',
      } as unknown as Note;
      const updateNoteDto = {
        title: 'new title',
        content: 'https://same.example.com',
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await expect(
        service.update(projectId, 1, updateNoteDto),
      ).resolves.toBeDefined();
    });
    it("allows clearing a 'url' note's content to empty on update", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'url',
        content: 'https://old.example.com',
      } as unknown as Note;
      const updateNoteDto = { content: '' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await expect(
        service.update(projectId, 1, updateNoteDto),
      ).resolves.toBeDefined();
    });
  });

  describe('ip validation', () => {
    it("creates an 'ip' note with a well-formed IPv4 address", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'ip' as const,
        content: '192.168.1.1',
      };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("creates an 'ip' note with a well-formed IPv6 address", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'ip' as const,
        content: '2001:db8::1',
      };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("allows creating an 'ip' note with empty content", async () => {
      const projectId = 1;
      const createNoteDto = { type: 'ip' as const, content: '' };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("allows creating an 'ip' note with null content", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'ip' as const,
        content: null as unknown as string,
      };
      const createdNote = {
        id: 7,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(result).toEqual(createdNote);
    });

    it("rejects creating an 'ip' note with a malformed address", async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'ip' as const,
        content: 'not an ip',
      };

      await expect(service.create(projectId, createNoteDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteRepository.create).not.toHaveBeenCalled();
    });

    it("does not validate content as an IP address for non-'ip' note types", async () => {
      const projectId = 1;
      const createNoteDto = { content: 'not an ip' };
      const createdNote = {
        id: 1,
        projectId,
        type: 'standard',
        content: 'not an ip',
      } as unknown as Note;

      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      await expect(service.create(projectId, createNoteDto)).resolves.toEqual(
        createdNote,
      );
    });

    it("re-validates an 'ip' note's content when it is updated", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'ip',
        content: '10.0.0.1',
      } as unknown as Note;
      const updateNoteDto = { content: 'not an ip' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);

      await expect(service.update(projectId, 1, updateNoteDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteRepository.save).not.toHaveBeenCalled();
    });

    it("does not re-validate an 'ip' note's content when it is unchanged", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'ip',
        content: '10.0.0.1',
        title: 'old title',
      } as unknown as Note;
      const updateNoteDto = {
        title: 'new title',
        content: '10.0.0.1',
      };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await expect(
        service.update(projectId, 1, updateNoteDto),
      ).resolves.toBeDefined();
    });

    it("allows clearing an 'ip' note's content to empty on update", async () => {
      const projectId = 1;
      const existingNote = {
        id: 1,
        projectId,
        type: 'ip',
        content: '10.0.0.1',
      } as unknown as Note;
      const updateNoteDto = { content: '' };

      mockNoteRepository.findOne.mockResolvedValue(existingNote);
      mockNoteRepository.save.mockImplementation((note: Note) =>
        Promise.resolve(note),
      );

      await expect(
        service.update(projectId, 1, updateNoteDto),
      ).resolves.toBeDefined();
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
