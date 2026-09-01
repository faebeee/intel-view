import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectGroupMcpController } from './project-group-mcp.controller';
import { ProjectGroupService } from '../project-group/project-group.service';

describe('ProjectGroupMcpController', () => {
  let controller: ProjectGroupMcpController;
  const mockProjectGroupService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  function buildGroup(overrides = {}) {
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
      controllers: [ProjectGroupMcpController],
      providers: [
        { provide: ProjectGroupService, useValue: mockProjectGroupService },
      ],
    }).compile();

    controller = module.get<ProjectGroupMcpController>(
      ProjectGroupMcpController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createProjectGroup', () => {
    it('creates a project group and returns it as a text tool result', async () => {
      const group = buildGroup();
      mockProjectGroupService.create.mockResolvedValue(group);

      const result = await controller.createProjectGroup({
        name: 'Ops',
        color: '#00f2ff',
      });

      expect(mockProjectGroupService.create).toHaveBeenCalledWith({
        name: 'Ops',
        color: '#00f2ff',
      });
      expect(parseResult(result)).toEqual({
        id: 1,
        name: 'Ops',
        description: null,
        color: '#00f2ff',
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      });
    });
  });

  describe('listProjectGroups', () => {
    it('lists project groups, mapping each to a response DTO', async () => {
      const group = buildGroup();
      mockProjectGroupService.findAll.mockResolvedValue({
        data: [group],
        meta: { totalItems: 1 },
      });

      const result = await controller.listProjectGroups({
        page: 1,
        limit: 10,
      });

      expect(mockProjectGroupService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(parseResult(result)).toMatchObject({
        meta: { totalItems: 1 },
        data: [{ id: 1, name: 'Ops' }],
      });
    });
  });

  describe('getProjectGroup', () => {
    it('returns the project group when found', async () => {
      const group = buildGroup();
      mockProjectGroupService.findOne.mockResolvedValue(group);

      const result = await controller.getProjectGroup({ id: 1 });

      expect(mockProjectGroupService.findOne).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });

    it('throws NotFoundException when the project group does not exist', async () => {
      mockProjectGroupService.findOne.mockResolvedValue(null);

      await expect(controller.getProjectGroup({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProjectGroup', () => {
    it('updates the project group and returns it', async () => {
      const group = buildGroup({ name: 'Renamed' });
      mockProjectGroupService.update.mockResolvedValue(group);

      const result = await controller.updateProjectGroup({
        id: 1,
        name: 'Renamed',
      });

      expect(mockProjectGroupService.update).toHaveBeenCalledWith(1, {
        name: 'Renamed',
      });
      expect(parseResult(result)).toMatchObject({ name: 'Renamed' });
    });

    it('throws NotFoundException when the project group does not exist', async () => {
      mockProjectGroupService.update.mockResolvedValue(null);

      await expect(
        controller.updateProjectGroup({ id: 99, name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProjectGroup', () => {
    it('deletes the project group', async () => {
      mockProjectGroupService.remove.mockResolvedValue(true);

      const result = await controller.deleteProjectGroup({ id: 1 });

      expect(mockProjectGroupService.remove).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toEqual({
        message: 'Project group with ID 1 successfully deleted',
      });
    });

    it('throws NotFoundException when the project group does not exist', async () => {
      mockProjectGroupService.remove.mockResolvedValue(false);

      await expect(controller.deleteProjectGroup({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
