import { Test, TestingModule } from '@nestjs/testing';
import { ProjectFolderController } from './project-folder.controller';
import { ProjectFolderService } from './project-folder.service';

describe('ProjectFolderController', () => {
  let controller: ProjectFolderController;
  const mockProjectFolderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    countProjectsByFolder: jest.fn().mockResolvedValue({
      countsByFolderId: new Map(),
      ungroupedCount: 0,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectFolderController],
      providers: [
        {
          provide: ProjectFolderService,
          useValue: mockProjectFolderService,
        },
      ],
    }).compile();

    controller = module.get<ProjectFolderController>(ProjectFolderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
