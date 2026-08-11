import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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
        parentId: null,
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

    it('creates a nested note and maps parentId in the response', async () => {
      const projectId = 1;
      const createNoteDto = {
        content: 'child note',
        parentId: 5,
      };
      const createdNote = {
        id: 2,
        projectId,
        content: 'child note',
        tags: [],
        parentId: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteService.create.mockResolvedValue(createdNote);

      const result = await controller.create(projectId, createNoteDto);

      expect(mockNoteService.create).toHaveBeenCalledWith(
        projectId,
        createNoteDto,
      );
      expect(result.parentId).toBe(5);
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

      expect(mockNoteService.findLogEntries).toHaveBeenCalledWith(
        projectId,
        1,
      );
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
      expect(result[1].label).toBeNull();
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findLocations.mockResolvedValue(null);

      await expect(controller.findLocations(1, 999)).rejects.toThrow(
        NotFoundException,
      );
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
