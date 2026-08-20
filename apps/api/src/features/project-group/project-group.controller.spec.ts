import { Test, TestingModule } from '@nestjs/testing';
import { ProjectGroupController } from './project-group.controller';
import { ProjectGroupService } from './project-group.service';

describe('ProjectGroupController', () => {
  let controller: ProjectGroupController;
  const mockProjectGroupService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectGroupController],
      providers: [
        {
          provide: ProjectGroupService,
          useValue: mockProjectGroupService,
        },
      ],
    }).compile();

    controller = module.get<ProjectGroupController>(ProjectGroupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
