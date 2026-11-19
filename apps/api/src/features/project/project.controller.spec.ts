import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

describe('ProjectController', () => {
  let controller: ProjectController;
  const mockProjectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    saveAsTemplate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: mockProjectService,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('saveAsTemplate', () => {
    it('returns the created template as a response DTO', async () => {
      mockProjectService.saveAsTemplate.mockResolvedValue({
        id: 7,
        name: 'Op (template)',
        description: null,
        folderId: null,
        folder: null,
        color: 'ocean',
        status: 'planned',
        isTemplate: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const result = await controller.saveAsTemplate(1, { name: 'x' });

      expect(mockProjectService.saveAsTemplate).toHaveBeenCalledWith(1, {
        name: 'x',
      });
      expect(result).toMatchObject({ id: 7, isTemplate: true });
      expect(result).not.toHaveProperty('deletedAt');
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockProjectService.saveAsTemplate.mockResolvedValue(null);

      await expect(controller.saveAsTemplate(1, {})).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
