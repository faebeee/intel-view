import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: getDataSourceToken(),
          useValue: mockDataSource,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns ok when the database is reachable', async () => {
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result).toEqual({ status: 'ok' });
  });

  it('throws ServiceUnavailableException when the database is unreachable', async () => {
    mockDataSource.query.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
