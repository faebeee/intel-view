import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TagService } from './tag.service';
import { Tag } from './entities/tag.entity';
import { Note } from '../note/entities/note.entity';

describe('TagService', () => {
  let service: TagService;
  const mockTagRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockNoteRepository = {
    find: jest.fn(),
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
          provide: getRepositoryToken(Note),
          useValue: mockNoteRepository,
        },
      ],
    }).compile();

    service = module.get<TagService>(TagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
