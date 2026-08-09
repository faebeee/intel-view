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
});
