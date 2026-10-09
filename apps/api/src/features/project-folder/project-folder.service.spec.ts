import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProjectFolderService } from './project-folder.service';
import { ProjectFolder } from './entities/project-folder.entity';
import { Project } from '../project/entities/project.entity';

describe('ProjectFolderService', () => {
  let service: ProjectFolderService;
  const mockProjectFolderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const mockProjectRepository = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectFolderService,
        {
          provide: getRepositoryToken(ProjectFolder),
          useValue: mockProjectFolderRepository,
        },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProjectFolderService>(ProjectFolderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assertExists', () => {
    it('throws a NotFoundException when the folder does not exist', async () => {
      mockProjectFolderRepository.findOne.mockResolvedValue(null);

      await expect(service.assertExists(999)).rejects.toThrow(
        'Project folder with ID 999 not found',
      );
    });

    it('resolves without throwing when the folder exists', async () => {
      mockProjectFolderRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.assertExists(1)).resolves.toBeUndefined();
    });
  });

  describe('remove', () => {
    it('soft-deletes the folder and unassigns its projects in a transaction', async () => {
      mockProjectFolderRepository.findOne.mockResolvedValue({ id: 1 });
      const manager = { update: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<void>) => cb(manager),
      );

      const result = await service.remove(1);

      expect(result).toBe(true);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledTimes(2);
    });

    it('returns false when the folder does not exist', async () => {
      mockProjectFolderRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBe(false);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('countProjectsByFolder', () => {
    it('splits counts into per-folder entries and an ungrouped count', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([
        { folderId: 1, count: '3' },
        { folderId: null, count: '2' },
      ]);

      const result = await service.countProjectsByFolder();

      expect(result.countsByFolderId.get(1)).toBe(3);
      expect(result.ungroupedCount).toBe(2);
    });
  });
});
