import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { ProjectGroupService } from '../project-group/project-group.service';

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
  const mockProjectGroupService = {
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
          provide: ProjectGroupService,
          useValue: mockProjectGroupService,
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

    it('validates the group exists when assigning a groupId', async () => {
      const existingProject = { id: 1, name: 'Op Blue Horizon', groupId: null };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      await service.update(1, { groupId: 5 });

      expect(mockProjectGroupService.assertExists).toHaveBeenCalledWith(5);
    });

    it('persists the selected mapTheme on the project', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        mapTheme: 'street',
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      const result = await service.update(1, { mapTheme: 'dark' });

      expect(result).toMatchObject({ mapTheme: 'dark' });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ mapTheme: 'dark' }),
      );
    });

    it('replaces project tags when tags are provided', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        mapTheme: 'street',
        tags: [],
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );
      const manager = {
        update: jest.fn(),
        create: jest.fn((entity: unknown, payload: unknown) => payload),
        save: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<void>) => cb(manager),
      );

      await service.update(1, { tags: ['alpha', 'beta', 'alpha'] });

      expect(manager.update).toHaveBeenCalledTimes(1);
      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ name: 'alpha', color: '#00f2ff' }),
          expect.objectContaining({ name: 'beta', color: '#00f2ff' }),
        ]),
      );
    });
  });

  describe('create', () => {
    it('persists normalized tags with the new project', async () => {
      const manager = {
        create: jest.fn((entity: unknown, payload: unknown) => payload),
        save: jest.fn(async (target: unknown, entity: unknown) => {
          if (target === Project) {
            return { id: 1, name: 'New Project' };
          }

          return entity;
        }),
      };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<unknown>) => cb(manager),
      );
      mockProjectRepository.findOne.mockResolvedValueOnce({
        id: 1,
        name: 'New Project',
        tags: [],
      });

      const result = await service.create({
        name: 'New Project',
        tags: ['alpha', ' beta ', 'alpha'],
      });

      expect(result).toBeDefined();
      expect(manager.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('cascades soft-delete to notes and tags in a transaction', async () => {
      mockProjectRepository.findOne.mockResolvedValue({ id: 1 });
      const manager = { update: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<void>) => cb(manager),
      );

      const result = await service.remove(1);

      expect(result).toBe(true);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledTimes(3);
    });

    it('returns false when the project does not exist', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBe(false);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
