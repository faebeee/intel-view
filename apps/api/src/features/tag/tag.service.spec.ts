import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { ProjectAccessService } from '../project/project-access.service';

describe('TagService', () => {
  let service: TagService;
  const mockTagRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const mockProjectAccessService = {
    assertExists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagService,
        {
          provide: getRepositoryToken(Tag),
          useValue: mockTagRepository,
        },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
    mockProjectAccessService.assertExists.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
