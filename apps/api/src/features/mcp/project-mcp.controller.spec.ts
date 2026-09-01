import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectMcpController } from './project-mcp.controller';
import { ProjectService } from '../project/project.service';

describe('ProjectMcpController', () => {
  let controller: ProjectMcpController;
  const mockProjectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  function buildProject(overrides = {}) {
    return {
      id: 1,
      name: 'Op Blue Horizon',
      description: null,
      groupId: null,
      group: null,
      mapTheme: 'street',
      color: 'ocean',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      ...overrides,
    };
  }

  function parseResult(result: { content: [{ type: 'text'; text: string }] }) {
    return JSON.parse(result.content[0].text) as unknown;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectMcpController],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    }).compile();

    controller = module.get<ProjectMcpController>(ProjectMcpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProject', () => {
    it('creates a project and returns it as a text tool result', async () => {
      const project = buildProject();
      mockProjectService.create.mockResolvedValue(project);

      const result = await controller.createProject({
        name: 'Op Blue Horizon',
      });

      expect(mockProjectService.create).toHaveBeenCalledWith({
        name: 'Op Blue Horizon',
      });
      expect(parseResult(result)).toMatchObject({
        id: 1,
        name: 'Op Blue Horizon',
      });
    });
  });

  describe('listProjects', () => {
    it('lists projects, mapping each to a response DTO', async () => {
      const project = buildProject();
      mockProjectService.findAll.mockResolvedValue({
        data: [project],
        meta: { totalItems: 1 },
      });

      const result = await controller.listProjects({ page: 1, limit: 10 });

      expect(mockProjectService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(parseResult(result)).toMatchObject({
        meta: { totalItems: 1 },
        data: [{ id: 1, name: 'Op Blue Horizon' }],
      });
    });
  });

  describe('getProject', () => {
    it('returns the project when found', async () => {
      mockProjectService.findOne.mockResolvedValue(buildProject());

      const result = await controller.getProject({ id: 1 });

      expect(mockProjectService.findOne).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockProjectService.findOne.mockResolvedValue(null);

      await expect(controller.getProject({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProject', () => {
    it('updates the project and returns it', async () => {
      mockProjectService.update.mockResolvedValue(
        buildProject({ name: 'Renamed' }),
      );

      const result = await controller.updateProject({
        id: 1,
        name: 'Renamed',
      });

      expect(mockProjectService.update).toHaveBeenCalledWith(1, {
        name: 'Renamed',
      });
      expect(parseResult(result)).toMatchObject({ name: 'Renamed' });
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockProjectService.update.mockResolvedValue(null);

      await expect(
        controller.updateProject({ id: 99, name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProject', () => {
    it('deletes the project', async () => {
      mockProjectService.remove.mockResolvedValue(true);

      const result = await controller.deleteProject({ id: 1 });

      expect(mockProjectService.remove).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toEqual({
        message: 'Project with ID 1 successfully deleted',
      });
    });

    it('throws NotFoundException when the project does not exist', async () => {
      mockProjectService.remove.mockResolvedValue(false);

      await expect(controller.deleteProject({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
