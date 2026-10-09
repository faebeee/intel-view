import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectFolderMcpController } from './project-folder-mcp.controller';
import { ProjectFolderService } from '../project-folder/project-folder.service';

describe('ProjectFolderMcpController', () => {
  let controller: ProjectFolderMcpController;
  const mockProjectFolderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  function buildFolder(overrides = {}) {
    return {
      id: 1,
      name: 'Ops',
      description: null,
      color: '#00f2ff',
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
      controllers: [ProjectFolderMcpController],
      providers: [
        { provide: ProjectFolderService, useValue: mockProjectFolderService },
      ],
    }).compile();

    controller = module.get<ProjectFolderMcpController>(
      ProjectFolderMcpController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProjectFolder', () => {
    it('creates a project folder and returns it as a text tool result', async () => {
      const folder = buildFolder();
      mockProjectFolderService.create.mockResolvedValue(folder);

      const result = await controller.createProjectFolder({
        name: 'Ops',
        color: '#00f2ff',
      });

      expect(mockProjectFolderService.create).toHaveBeenCalledWith({
        name: 'Ops',
        color: '#00f2ff',
      });
      expect(parseResult(result)).toEqual({
        id: 1,
        name: 'Ops',
        description: null,
        color: '#00f2ff',
        createdAt: folder.createdAt.toISOString(),
        updatedAt: folder.updatedAt.toISOString(),
        projectsCount: 0,
      });
    });
  });

  describe('listProjectFolders', () => {
    it('lists project folders, mapping each to a response DTO', async () => {
      const folder = buildFolder();
      mockProjectFolderService.findAll.mockResolvedValue({
        data: [folder],
        meta: { totalItems: 1 },
      });

      const result = await controller.listProjectFolders({
        page: 1,
        limit: 10,
      });

      expect(mockProjectFolderService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(parseResult(result)).toMatchObject({
        meta: { totalItems: 1 },
        data: [{ id: 1, name: 'Ops' }],
      });
    });
  });

  describe('getProjectFolder', () => {
    it('returns the project folder when found', async () => {
      const folder = buildFolder();
      mockProjectFolderService.findOne.mockResolvedValue(folder);

      const result = await controller.getProjectFolder({ id: 1 });

      expect(mockProjectFolderService.findOne).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });

    it('throws NotFoundException when the project folder does not exist', async () => {
      mockProjectFolderService.findOne.mockResolvedValue(null);

      await expect(controller.getProjectFolder({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProjectFolder', () => {
    it('updates the project folder and returns it', async () => {
      const folder = buildFolder({ name: 'Renamed' });
      mockProjectFolderService.update.mockResolvedValue(folder);

      const result = await controller.updateProjectFolder({
        id: 1,
        name: 'Renamed',
      });

      expect(mockProjectFolderService.update).toHaveBeenCalledWith(1, {
        name: 'Renamed',
      });
      expect(parseResult(result)).toMatchObject({ name: 'Renamed' });
    });

    it('throws NotFoundException when the project folder does not exist', async () => {
      mockProjectFolderService.update.mockResolvedValue(null);

      await expect(
        controller.updateProjectFolder({ id: 99, name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProjectFolder', () => {
    it('deletes the project folder', async () => {
      mockProjectFolderService.remove.mockResolvedValue(true);

      const result = await controller.deleteProjectFolder({ id: 1 });

      expect(mockProjectFolderService.remove).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toEqual({
        message: 'Project folder with ID 1 successfully deleted',
      });
    });

    it('throws NotFoundException when the project folder does not exist', async () => {
      mockProjectFolderService.remove.mockResolvedValue(false);

      await expect(controller.deleteProjectFolder({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
