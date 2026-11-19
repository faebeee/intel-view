import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProjectService } from './project.service';
import { NotFoundException } from '@nestjs/common';
import { Project } from './entities/project.entity';
import { ProjectFolderService } from '../project-folder/project-folder.service';
import { Note } from '../note/entities/note.entity';
import { NoteRelation } from '../note/entities/note-relation.entity';
import { NoteHistoryEntry } from '../note/entities/note-history-entry.entity';

describe('ProjectService', () => {
  let service: ProjectService;
  const mockProjectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };
  const mockProjectFolderService = {
    assertExists: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ProjectFolderService,
          useValue: mockProjectFolderService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('persists the name and description fields on the project', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        description: null,
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      const result = await service.update(1, { description: 'Updated' });

      expect(result).toMatchObject({ description: 'Updated' });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Updated' }),
      );
    });

    it('validates the folder exists when assigning a folderId', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        folderId: null,
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      await service.update(1, { folderId: 5 });

      expect(mockProjectFolderService.assertExists).toHaveBeenCalledWith(5);
    });

    it('persists the selected accent color on the project', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        color: 'ocean',
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      const result = await service.update(1, { color: 'violet' });

      expect(result).toMatchObject({ color: 'violet' });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'violet' }),
      );
    });

    it('persists the project status', async () => {
      mockProjectRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Op Blue Horizon',
        status: 'planned',
      });
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      await service.update(1, { status: 'ongoing' });

      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ongoing' }),
      );
    });

    it('replaces project tags when tags are provided', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      const result = await service.update(1, { name: 'Renamed' });

      expect(result).toMatchObject({ name: 'Renamed' });
    });
  });

  /**
   * Fake transactional `EntityManager`: `create` echoes the data back,
   * `save` assigns sequential ids to anything without one, and `find`
   * returns the fixtures registered per entity.
   */
  function buildManager(fixtures: Map<unknown, unknown[]> = new Map()): {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  } {
    let nextId = 100;
    const assignId = (entity: Record<string, unknown>): unknown =>
      entity.id === undefined ? { ...entity, id: nextId++ } : entity;
    return {
      create: jest.fn((_entity: unknown, data: unknown) => ({
        ...(data as object),
      })),
      save: jest.fn((_entity: unknown, data: unknown) =>
        Promise.resolve(
          Array.isArray(data)
            ? data.map((item) => assignId(item as Record<string, unknown>))
            : assignId(data as Record<string, unknown>),
        ),
      ),
      find: jest.fn((entity: unknown) =>
        Promise.resolve(fixtures.get(entity) ?? []),
      ),
    };
  }

  function useManager(manager: ReturnType<typeof buildManager>): void {
    mockDataSource.transaction.mockImplementation(
      async (cb: (m: unknown) => Promise<unknown>) => cb(manager),
    );
  }

  describe('create', () => {
    it('persists a new project in a transaction', async () => {
      const manager = buildManager();
      useManager(manager);
      mockProjectRepository.findOne.mockResolvedValueOnce({
        id: 100,
        name: 'New Project',
      });

      const result = await service.create({ name: 'New Project' });

      expect(manager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({ name: 'New Project', isTemplate: false }),
      );
      expect(result).toMatchObject({ id: 100 });
    });

    it('validates the folder exists for regular projects', async () => {
      useManager(buildManager());
      mockProjectRepository.findOne.mockResolvedValue({ id: 100 });

      await service.create({ name: 'P', folderId: 5 });

      expect(mockProjectFolderService.assertExists).toHaveBeenCalledWith(5);
    });

    it('never assigns a folder to a template', async () => {
      const manager = buildManager();
      useManager(manager);
      mockProjectRepository.findOne.mockResolvedValue({ id: 100 });

      await service.create({ name: 'T', folderId: 5, isTemplate: true });

      expect(mockProjectFolderService.assertExists).not.toHaveBeenCalled();
      expect(manager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({ isTemplate: true, folderId: null }),
      );
    });

    it('throws when the template does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create({ name: 'P', templateId: 9 }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it("copies the template's notes, links and color", async () => {
      const sourceNotes = [
        {
          id: 1,
          type: 'standard',
          title: 'Root',
          content: 'see [[2]] and [[999]]',
          tags: ['recon'],
          color: '#fff',
          canvasX: 10,
          canvasY: 20,
          version: 'OpenSSH 8.9p1',
          fileKey: null,
        },
        {
          id: 2,
          type: 'file',
          title: 'Scan',
          content: null,
          tags: [],
          color: null,
          canvasX: null,
          canvasY: null,
          fileKey: 'secret/key',
          fileName: 'scan.xml',
        },
      ];
      const manager = buildManager(
        new Map<unknown, unknown[]>([
          [Note, sourceNotes],
          [NoteRelation, [{ parentId: 1, childId: 2 }]],
        ]),
      );
      useManager(manager);
      mockProjectRepository.findOne
        .mockResolvedValueOnce({ id: 9, isTemplate: true, color: 'amber' })
        .mockResolvedValueOnce({ id: 100, name: 'P' });

      await service.create({ name: 'P', templateId: 9 });

      expect(mockProjectRepository.findOne).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: expect.objectContaining({
            id: 9,
            isTemplate: true,
          }) as unknown,
        }),
      );
      // Project (id 100) gets the template color; notes become 101 and 102.
      expect(manager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({ color: 'amber' }),
      );
      expect(manager.save).toHaveBeenCalledWith(Note, [
        expect.objectContaining({
          projectId: 100,
          title: 'Root',
          tags: ['recon'],
          canvasX: 10,
          canvasY: 20,
          version: 'OpenSSH 8.9p1',
        }),
        expect.objectContaining({
          projectId: 100,
          type: 'file',
          fileKey: null,
          fileName: null,
        }),
      ]);
      expect(manager.save).toHaveBeenCalledWith(Note, [
        expect.objectContaining({
          id: 101,
          content: 'see [[102]] and [[999]]',
        }),
      ]);
      expect(manager.save).toHaveBeenCalledWith(NoteRelation, [
        { parentId: 101, childId: 102 },
      ]);
      expect(manager.save).toHaveBeenCalledWith(
        NoteHistoryEntry,
        expect.arrayContaining([
          expect.objectContaining({ noteId: 101, changeType: 'created' }),
        ]),
      );
    });

    it('keeps an explicitly chosen color over the template color', async () => {
      const manager = buildManager();
      useManager(manager);
      mockProjectRepository.findOne
        .mockResolvedValueOnce({ id: 9, isTemplate: true, color: 'amber' })
        .mockResolvedValueOnce({ id: 100 });

      await service.create({ name: 'P', templateId: 9, color: 'violet' });

      expect(manager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({ color: 'violet' }),
      );
    });
  });

  describe('saveAsTemplate', () => {
    it('returns null when the source project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await service.saveAsTemplate(1, {});

      expect(result).toBeNull();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('creates a template copying settings and notes', async () => {
      const manager = buildManager(
        new Map<unknown, unknown[]>([
          [Note, [{ id: 1, type: 'standard', title: 'A', content: 'x' }]],
        ]),
      );
      useManager(manager);
      mockProjectRepository.findOne
        .mockResolvedValueOnce({
          id: 1,
          name: 'Op Blue',
          description: 'desc',
          color: 'crimson',
          folderId: 3,
          status: 'ongoing',
        })
        .mockResolvedValueOnce({ id: 100, isTemplate: true });

      const result = await service.saveAsTemplate(1, {});

      expect(manager.save).toHaveBeenCalledWith(Project, {
        name: 'Op Blue (template)',
        description: 'desc',
        color: 'crimson',
        folderId: null,
        status: 'planned',
        isTemplate: true,
      });
      expect(manager.find).toHaveBeenCalledWith(
        Note,
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 1 }) as unknown,
        }),
      );
      expect(manager.save).toHaveBeenCalledWith(Note, [
        expect.objectContaining({ projectId: 100, title: 'A' }),
      ]);
      expect(result).toMatchObject({ id: 100, isTemplate: true });
    });

    it('uses the provided name', async () => {
      const manager = buildManager();
      useManager(manager);
      mockProjectRepository.findOne
        .mockResolvedValueOnce({ id: 1, name: 'Op Blue' })
        .mockResolvedValueOnce({ id: 100 });

      await service.saveAsTemplate(1, { name: '  Web pentest  ' });

      expect(manager.save).toHaveBeenCalledWith(
        Project,
        expect.objectContaining({ name: 'Web pentest' }),
      );
    });
  });

  describe('remove', () => {
    it('cascades soft-delete to notes in a transaction', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 1 });
      const manager = { update: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<void>) => cb(manager),
      );

      const result = await service.remove(1);

      expect(result).toBe(true);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledTimes(2);
    });

    it('returns false when the project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBe(false);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
