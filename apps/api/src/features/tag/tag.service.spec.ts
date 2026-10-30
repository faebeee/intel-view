import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { DEFAULT_TAGS } from './default-tags';

describe('TagService', () => {
  let service: TagService;
  const mockTagRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates and saves a tag', async () => {
      const dto = { name: 'Checkpoint', color: '#ef4444' };
      const created = { ...dto };
      const saved = { id: 1, ...dto };
      mockTagRepository.create.mockReturnValue(created);
      mockTagRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(mockTagRepository.create).toHaveBeenCalledWith(dto);
      expect(mockTagRepository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(saved);
    });

    it('throws a ConflictException when the tag name already exists', async () => {
      const dto = { name: 'Checkpoint', color: '#ef4444' };
      mockTagRepository.create.mockReturnValue(dto);
      const uniqueViolation = Object.assign(
        new QueryFailedError('query', [], new Error('duplicate key')),
        { code: '23505' },
      );
      mockTagRepository.save.mockRejectedValue(uniqueViolation);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('returns null when the tag does not exist', async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('returns null when the tag does not exist', async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      const result = await service.update(999, { name: 'New name' });

      expect(result).toBeNull();
      expect(mockTagRepository.save).not.toHaveBeenCalled();
    });

    it('updates and saves the tag when it exists', async () => {
      const existing = {
        id: 1,
        name: 'Old',
        color: '#000',
        updatedAt: new Date(0),
      };
      mockTagRepository.findOne.mockResolvedValue(existing);
      mockTagRepository.save.mockImplementation((tag: unknown) => tag);

      const result = await service.update(1, { name: 'New' });

      expect(mockTagRepository.save).toHaveBeenCalled();
      expect((result as { name: string }).name).toBe('New');
    });
  });

  describe('remove', () => {
    it('returns false when the tag does not exist', async () => {
      mockTagRepository.findOne.mockResolvedValue(null);

      const result = await service.remove(999);

      expect(result).toBe(false);
      expect(mockTagRepository.update).not.toHaveBeenCalled();
    });

    it('soft-deletes the tag when it exists', async () => {
      mockTagRepository.findOne.mockResolvedValue({ id: 1 });
      mockTagRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1);

      expect(result).toBe(true);
      const [criteria, update] = mockTagRepository.update.mock.calls[0] as [
        { id: number },
        { deletedAt: Date },
      ];
      expect(criteria).toEqual({ id: 1 });
      expect(update.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('ensureDefaultTagsExist', () => {
    it('inserts every default tag into an empty table', async () => {
      mockTagRepository.find.mockResolvedValue([]);
      mockTagRepository.create.mockImplementation(
        (tag: { name: string; color: string }) => tag,
      );
      mockTagRepository.save.mockResolvedValue(undefined);

      await service.ensureDefaultTagsExist();

      expect(mockTagRepository.save).toHaveBeenCalledWith(
        DEFAULT_TAGS.map((tag) => ({ name: tag.name, color: tag.color })),
      );
    });

    it('skips default tags that already exist, matched case-insensitively', async () => {
      const [firstDefault, secondDefault] = DEFAULT_TAGS;
      mockTagRepository.find.mockResolvedValue([
        { name: firstDefault.name.toUpperCase() },
      ]);
      mockTagRepository.create.mockImplementation(
        (tag: { name: string; color: string }) => tag,
      );
      mockTagRepository.save.mockResolvedValue(undefined);

      await service.ensureDefaultTagsExist();

      const savedTags = (
        mockTagRepository.save.mock.calls[0] as [{ name: string }[]]
      )[0];
      expect(savedTags).not.toContainEqual(
        expect.objectContaining({ name: firstDefault.name }),
      );
      expect(savedTags).toContainEqual(
        expect.objectContaining({ name: secondDefault.name }),
      );
    });

    it('does nothing when every default tag already exists', async () => {
      mockTagRepository.find.mockResolvedValue(
        DEFAULT_TAGS.map((tag) => ({ name: tag.name })),
      );

      await service.ensureDefaultTagsExist();

      expect(mockTagRepository.save).not.toHaveBeenCalled();
    });
  });
});
