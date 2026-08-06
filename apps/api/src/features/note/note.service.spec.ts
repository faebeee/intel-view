import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
      const createdNote = {
        id: 1,
        projectId,
        ...createNoteDto,
      } as unknown as Note;

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
      } as unknown as Note;

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
  });

  describe('nesting (parentId)', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('creates a note with a valid parentId', async () => {
      const projectId = 1;
      const createNoteDto = { content: 'child note', parentId: 5 };
      const createdNote = {
        id: 10,
        projectId,
        content: 'child note',
        parentId: 5,
      } as unknown as Note;

      mockProjectRepository.findOne.mockResolvedValue({ id: projectId });
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

      mockProjectRepository.findOne.mockResolvedValue({ id: projectId });
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
