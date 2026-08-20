import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ProjectGroupService } from './project-group.service';
import { ProjectGroup } from './entities/project-group.entity';

describe('ProjectGroupService', () => {
  let service: ProjectGroupService;
  const mockProjectGroupRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectGroupService,
        {
          provide: getRepositoryToken(ProjectGroup),
          useValue: mockProjectGroupRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ProjectGroupService>(ProjectGroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assertExists', () => {
    it('throws a NotFoundException when the group does not exist', async () => {
      mockProjectGroupRepository.findOne.mockResolvedValue(null);

      await expect(service.assertExists(999)).rejects.toThrow(
        'Project group with ID 999 not found',
      );
    });

    it('resolves without throwing when the group exists', async () => {
      mockProjectGroupRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.assertExists(1)).resolves.toBeUndefined();
    });
  });

  describe('remove', () => {
    it('soft-deletes the group and unassigns its projects in a transaction', async () => {
      mockProjectGroupRepository.findOne.mockResolvedValue({ id: 1 });
      const manager = { update: jest.fn() };
      mockDataSource.transaction.mockImplementation(
        async (cb: (manager: unknown) => Promise<void>) => cb(manager),
      );

      const result = await service.remove(1);

      expect(result).toBe(true);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(manager.update).toHaveBeenCalledTimes(2);
    });

    it('returns false when the group does not exist', async () => {
      mockProjectGroupRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBe(false);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });
});
