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
