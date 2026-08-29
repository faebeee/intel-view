import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

describe('TagController', () => {
  let controller: TagController;
  const mockTagService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagController],
      providers: [
        {
          provide: TagService,
          useValue: mockTagService,
        },
      ],
    }).compile();

    controller = module.get<TagController>(TagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates a tag and returns its response DTO', async () => {
      const dto = { name: 'Checkpoint', color: '#ef4444' };
      const saved = {
        id: 1,
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTagService.create.mockResolvedValue(saved);

      const result = await controller.create(dto);

      expect(mockTagService.create).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({
        id: 1,
        name: 'Checkpoint',
        color: '#ef4444',
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the tag is missing', async () => {
      mockTagService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the tag is missing', async () => {
      mockTagService.update.mockResolvedValue(null);

      await expect(controller.update(999, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the tag is missing', async () => {
      mockTagService.remove.mockResolvedValue(false);

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('returns a confirmation message on success', async () => {
      mockTagService.remove.mockResolvedValue(true);

      const result = await controller.remove(1);

      expect(result).toEqual({ message: 'Tag with ID 1 successfully deleted' });
    });
  });
});
