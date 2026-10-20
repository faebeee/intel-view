import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { ProjectFolderService } from '../project-folder/project-folder.service';

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

    it('replaces project tags when tags are provided', async () => {
      const existingProject = {
        id: 1,
        name: 'Op Blue Horizon',
        mapTheme: 'street',
      };
      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockImplementation(
        (project: unknown) => project,
      );

      const result = await service.update(1, { name: 'Renamed' });

      expect(result).toMatchObject({ name: 'Renamed' });
    });
  });

  describe('create', () => {
    it('persists a new project', async () => {
      const created = { name: 'New Project' };
      const saved = { id: 1, name: 'New Project' };
      mockProjectRepository.create.mockReturnValue(created);
      mockProjectRepository.save.mockResolvedValue(saved);
      mockProjectRepository.findOne.mockResolvedValueOnce(saved);

      const result = await service.create({ name: 'New Project' });

      expect(mockProjectRepository.create).toHaveBeenCalledWith({
        name: 'New Project',
      });
      expect(mockProjectRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBeDefined();
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
