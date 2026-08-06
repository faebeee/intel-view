import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoteService } from './note.service';
import { Note } from './entities/note.entity';
import { Project } from '../project/entities/project.entity';

describe('NoteService', () => {
  let service: NoteService;
  const mockNoteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockProjectRepository = {
    findOne: jest.fn(),
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
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
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
      const createdNote = { id: 1, projectId, ...createNoteDto } as Note;

      mockProjectRepository.findOne.mockResolvedValue({ id: projectId });
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
      } as Note;

      mockProjectRepository.findOne.mockResolvedValue({ id: projectId });
      mockNoteRepository.create.mockReturnValue(createdNote);
      mockNoteRepository.save.mockResolvedValue(createdNote);

      const result = await service.create(projectId, createNoteDto);

      expect(mockNoteRepository.create).toHaveBeenCalledWith({
        ...createNoteDto,
        projectId,
      });
      expect(result.type).toBe('markdown');
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
      } as Note;
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
  });
});
