import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

describe('NoteController', () => {
  let controller: NoteController;
  const mockNoteService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findHistory: jest.fn(),
    findLocations: jest.fn(),
    findAllLocations: jest.fn(),
    createLogEntry: jest.fn(),
    findLogEntries: jest.fn(),
    addRelation: jest.fn(),
    removeRelation: jest.fn(),
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
    removeFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [
        {
          provide: NoteService,
          useValue: mockNoteService,
        },
      ],
    }).compile();

    controller = module.get<NoteController>(NoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates a note and maps it to a NoteResponseDto', async () => {
      const projectId = 1;
      const createNoteDto = {
        content: 'hello world',
      };
      const createdNote = {
        id: 1,
        projectId,
        content: 'hello world',
        tags: [],
        parentIds: [],
        childIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteService.create.mockResolvedValue(createdNote);

      const result = await controller.create(projectId, createNoteDto);

      expect(mockNoteService.create).toHaveBeenCalledWith(
        projectId,
        createNoteDto,
      );
      expect(result.content).toBe('hello world');
    });

    it('creates a nested note and maps parentIds in the response', async () => {
      const projectId = 1;
      const createNoteDto = {
        content: 'child note',
        parentIds: [5],
      };
      const createdNote = {
        id: 2,
        projectId,
        content: 'child note',
        tags: [],
        parentIds: [5],
        childIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteService.create.mockResolvedValue(createdNote);

      const result = await controller.create(projectId, createNoteDto);

      expect(mockNoteService.create).toHaveBeenCalledWith(
        projectId,
        createNoteDto,
      );
      expect(result.parentIds).toEqual([5]);
    });
  });

  describe('addParent / removeParent / addChild / removeChild', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('adds a parent relation and returns the refetched note', async () => {
      const projectId = 1;
      const note = {
        id: 2,
        projectId,
        parentIds: [5],
        childIds: [],
      };
      mockNoteService.addRelation.mockResolvedValue(undefined);
      mockNoteService.findOne.mockResolvedValue(note);

      const result = await controller.addParent(projectId, 2, {
        parentId: 5,
      });

      expect(mockNoteService.addRelation).toHaveBeenCalledWith(projectId, 5, 2);
      expect(result.parentIds).toEqual([5]);
    });

    it('removes a parent relation and returns the refetched note', async () => {
      const projectId = 1;
      const note = { id: 2, projectId, parentIds: [], childIds: [] };
      mockNoteService.removeRelation.mockResolvedValue(undefined);
      mockNoteService.findOne.mockResolvedValue(note);

      const result = await controller.removeParent(projectId, 2, 5);

      expect(mockNoteService.removeRelation).toHaveBeenCalledWith(
        projectId,
        5,
        2,
      );
      expect(result.parentIds).toEqual([]);
    });

    it('adds a child relation and returns the refetched note', async () => {
      const projectId = 1;
      const note = { id: 1, projectId, parentIds: [], childIds: [2] };
      mockNoteService.addRelation.mockResolvedValue(undefined);
      mockNoteService.findOne.mockResolvedValue(note);

      const result = await controller.addChild(projectId, 1, { childId: 2 });

      expect(mockNoteService.addRelation).toHaveBeenCalledWith(projectId, 1, 2);
      expect(result.childIds).toEqual([2]);
    });

    it('removes a child relation and returns the refetched note', async () => {
      const projectId = 1;
      const note = { id: 1, projectId, parentIds: [], childIds: [] };
      mockNoteService.removeRelation.mockResolvedValue(undefined);
      mockNoteService.findOne.mockResolvedValue(note);

      const result = await controller.removeChild(projectId, 1, 2);

      expect(mockNoteService.removeRelation).toHaveBeenCalledWith(
        projectId,
        1,
        2,
      );
      expect(result.childIds).toEqual([]);
    });

    it('throws NotFoundException when the refetched note is missing', async () => {
      mockNoteService.addRelation.mockResolvedValue(undefined);
      mockNoteService.findOne.mockResolvedValue(null);

      await expect(controller.addParent(1, 2, { parentId: 5 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findHistory', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("returns a note's history mapped to NoteHistoryEntryResponseDto", async () => {
      const projectId = 1;
      const historyEntries = [
        {
          id: 2,
          noteId: 1,
          changeType: 'updated' as const,
          changes: [
            { field: 'content', previousValue: 'old', newValue: 'new' },
          ],
          createdAt: new Date(),
        },
        {
          id: 1,
          noteId: 1,
          changeType: 'created' as const,
          changes: null,
          createdAt: new Date(),
        },
      ];

      mockNoteService.findHistory.mockResolvedValue(historyEntries);

      const result = await controller.findHistory(projectId, 1);

      expect(mockNoteService.findHistory).toHaveBeenCalledWith(projectId, 1);
      expect(result).toHaveLength(2);
      expect(result[0].changeType).toBe('updated');
      expect(result[1].changeType).toBe('created');
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findHistory.mockResolvedValue(null);

      await expect(controller.findHistory(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLogEntry', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('creates a log entry and maps it to a NoteLogEntryResponseDto', async () => {
      const projectId = 1;
      const createNoteLogEntryDto = { content: 'did a thing' };
      const createdEntry = {
        id: 1,
        noteId: 1,
        content: 'did a thing',
        createdAt: new Date(),
      };

      mockNoteService.createLogEntry.mockResolvedValue(createdEntry);

      const result = await controller.createLogEntry(
        projectId,
        1,
        createNoteLogEntryDto,
      );

      expect(mockNoteService.createLogEntry).toHaveBeenCalledWith(
        projectId,
        1,
        createNoteLogEntryDto,
      );
      expect(result.content).toBe('did a thing');
    });
  });

  describe('findLogEntries', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("returns a note's log entries mapped to NoteLogEntryResponseDto", async () => {
      const projectId = 1;
      const entries = [
        { id: 2, noteId: 1, content: 'second', createdAt: new Date() },
        { id: 1, noteId: 1, content: 'first', createdAt: new Date() },
      ];

      mockNoteService.findLogEntries.mockResolvedValue(entries);

      const result = await controller.findLogEntries(projectId, 1);

      expect(mockNoteService.findLogEntries).toHaveBeenCalledWith(projectId, 1);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('second');
      expect(result[1].content).toBe('first');
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findLogEntries.mockResolvedValue(null);

      await expect(controller.findLogEntries(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findLocations', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("returns a note's locations mapped to NoteLocationResponseDto", async () => {
      const projectId = 1;
      const locations = [
        {
          id: 1,
          noteId: 1,
          noteLabel: 'My Trip',
          tags: ['travel'],
          color: null,
          lat: 1.5,
          lng: 2.5,
          label: 'Home',
          createdAt: new Date(),
        },
        {
          id: 2,
          noteId: 1,
          noteLabel: 'My Trip',
          tags: ['travel'],
          color: null,
          lat: -3,
          lng: 4,
          label: null,
          createdAt: new Date(),
        },
      ];

      mockNoteService.findLocations.mockResolvedValue(locations);

      const result = await controller.findLocations(projectId, 1);

      expect(mockNoteService.findLocations).toHaveBeenCalledWith(projectId, 1);
      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Home');
      expect(result[0].noteLabel).toBe('My Trip');
      expect(result[0].tags).toEqual(['travel']);
      expect(result[0].color).toBeNull();
      expect(result[1].label).toBeNull();
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findLocations.mockResolvedValue(null);

      await expect(controller.findLocations(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('file endpoints', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    const uploadedFile = {
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      size: 1234,
      buffer: Buffer.from('pdf bytes'),
    } as Express.Multer.File;

    it('uploads a file and maps the note to a NoteResponseDto', async () => {
      mockNoteService.uploadFile.mockResolvedValue({
        id: 3,
        projectId: 1,
        type: 'file',
        fileName: 'report.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 1234,
        tags: [],
        parentIds: [],
        childIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.uploadFile(1, 3, uploadedFile);

      expect(mockNoteService.uploadFile).toHaveBeenCalledWith(
        1,
        3,
        uploadedFile,
      );
      expect(result.fileName).toBe('report.pdf');
      expect(result.fileSize).toBe(1234);
    });

    it('rejects an upload request without a file', async () => {
      await expect(controller.uploadFile(1, 3, undefined)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockNoteService.uploadFile).not.toHaveBeenCalled();
    });

    it("streams the note's file with its content type and length", async () => {
      mockNoteService.downloadFile.mockResolvedValue({
        stream: Readable.from(['pdf bytes']),
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1234,
      });

      const result = await controller.downloadFile(1, 3);

      expect(mockNoteService.downloadFile).toHaveBeenCalledWith(1, 3);
      expect(result.options.type).toBe('application/pdf');
      expect(result.options.length).toBe(1234);
    });

    it('removes the file and maps the note to a NoteResponseDto', async () => {
      mockNoteService.removeFile.mockResolvedValue({
        id: 3,
        projectId: 1,
        type: 'file',
        fileName: null,
        fileMimeType: null,
        fileSize: null,
        tags: [],
        parentIds: [],
        childIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.removeFile(1, 3);

      expect(mockNoteService.removeFile).toHaveBeenCalledWith(1, 3);
      expect(result.fileName).toBeNull();
    });
  });

  describe('findAllLocations', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns every location in the project mapped to NoteLocationResponseDto', async () => {
      const projectId = 1;
      const locations = [
        {
          id: 1,
          noteId: 1,
          noteLabel: 'Home',
          tags: ['family'],
          color: '#ff0000',
          lat: 1.5,
          lng: 2.5,
          label: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          noteId: 2,
          noteLabel: 'Office',
          tags: [],
          color: null,
          lat: -3,
          lng: 4,
          label: 'Work',
          createdAt: new Date(),
        },
      ];

      mockNoteService.findAllLocations.mockResolvedValue(locations);

      const result = await controller.findAllLocations(projectId);

      expect(mockNoteService.findAllLocations).toHaveBeenCalledWith(projectId);
      expect(result).toHaveLength(2);
      expect(result[0].noteLabel).toBe('Home');
      expect(result[0].tags).toEqual(['family']);
      expect(result[0].color).toBe('#ff0000');
      expect(result[1].noteLabel).toBe('Office');
      expect(result[1].label).toBe('Work');
    });

    it('returns an empty array when the project has no locations', async () => {
      mockNoteService.findAllLocations.mockResolvedValue([]);

      const result = await controller.findAllLocations(1);

      expect(result).toEqual([]);
    });
  });
});
