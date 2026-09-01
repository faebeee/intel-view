import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagMcpController } from './tag-mcp.controller';
import { TagService } from '../tag/tag.service';

describe('TagMcpController', () => {
  let controller: TagMcpController;
  const mockTagService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  function buildTag(overrides = {}) {
    return {
      id: 1,
      name: 'urgent',
      color: '#ff0000',
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
      controllers: [TagMcpController],
      providers: [{ provide: TagService, useValue: mockTagService }],
    }).compile();

    controller = module.get<TagMcpController>(TagMcpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTag', () => {
    it('creates a tag and returns it as a text tool result', async () => {
      mockTagService.create.mockResolvedValue(buildTag());

      const result = await controller.createTag({
        name: 'urgent',
        color: '#ff0000',
      });

      expect(mockTagService.create).toHaveBeenCalledWith({
        name: 'urgent',
        color: '#ff0000',
      });
      expect(parseResult(result)).toMatchObject({ id: 1, name: 'urgent' });
    });
  });

  describe('listTags', () => {
    it('lists tags, mapping each to a response DTO', async () => {
      mockTagService.findAll.mockResolvedValue({
        data: [buildTag()],
        meta: { totalItems: 1 },
      });

      const result = await controller.listTags({ page: 1, limit: 10 });

      expect(mockTagService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(parseResult(result)).toMatchObject({
        meta: { totalItems: 1 },
        data: [{ id: 1, name: 'urgent' }],
      });
    });
  });

  describe('getTag', () => {
    it('returns the tag when found', async () => {
      mockTagService.findOne.mockResolvedValue(buildTag());

      const result = await controller.getTag({ id: 1 });

      expect(mockTagService.findOne).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      mockTagService.findOne.mockResolvedValue(null);

      await expect(controller.getTag({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateTag', () => {
    it('updates the tag and returns it', async () => {
      mockTagService.update.mockResolvedValue(buildTag({ name: 'renamed' }));

      const result = await controller.updateTag({ id: 1, name: 'renamed' });

      expect(mockTagService.update).toHaveBeenCalledWith(1, {
        name: 'renamed',
      });
      expect(parseResult(result)).toMatchObject({ name: 'renamed' });
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      mockTagService.update.mockResolvedValue(null);

      await expect(controller.updateTag({ id: 99, name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteTag', () => {
    it('deletes the tag', async () => {
      mockTagService.remove.mockResolvedValue(true);

      const result = await controller.deleteTag({ id: 1 });

      expect(mockTagService.remove).toHaveBeenCalledWith(1);
      expect(parseResult(result)).toEqual({
        message: 'Tag with ID 1 successfully deleted',
      });
    });

    it('throws NotFoundException when the tag does not exist', async () => {
      mockTagService.remove.mockResolvedValue(false);

      await expect(controller.deleteTag({ id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
