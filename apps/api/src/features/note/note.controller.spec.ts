import { Test, TestingModule } from '@nestjs/testing';
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
    it('creates a note and maps it to a NoteResponseDto including type and config', async () => {
      const projectId = 1;
      const createNoteDto = {
        type: 'markdown' as const,
        content: 'hello world',
        config: { foo: 'bar' },
      };
      const createdNote = {
        id: 1,
        projectId,
        type: 'markdown',
        content: 'hello world',
        config: { foo: 'bar' },
        lat: null,
        lng: null,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockNoteService.create.mockResolvedValue(createdNote);

      const result = await controller.create(projectId, createNoteDto);

      expect(mockNoteService.create).toHaveBeenCalledWith(
        projectId,
        createNoteDto,
      );
      expect(result.type).toBe('markdown');
      expect(result.config).toEqual({ foo: 'bar' });
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
        type: 'markdown',
        content: 'child note',
        config: null,
        lat: null,
        lng: null,
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
});
