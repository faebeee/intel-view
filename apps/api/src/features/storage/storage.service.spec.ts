import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

const mockClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
  removeObject: jest.fn(),
};

jest.mock('minio', () => ({
  Client: jest.fn(() => mockClient),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    process.env.MINIO_BUCKET = 'test-bucket';
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();
    service = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.MINIO_BUCKET;
  });

  it('creates the configured bucket on boot when it does not exist', async () => {
    mockClient.bucketExists.mockResolvedValue(false);

    await service.onModuleInit();

    expect(mockClient.makeBucket).toHaveBeenCalledWith('test-bucket');
  });

  it('leaves an existing bucket alone', async () => {
    mockClient.bucketExists.mockResolvedValue(true);

    await service.onModuleInit();

    expect(mockClient.makeBucket).not.toHaveBeenCalled();
  });

  it('does not throw when object storage is unreachable on boot', async () => {
    mockClient.bucketExists.mockRejectedValue(new Error('connection refused'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });

  it('namespaces object keys by project and note, keeping the extension', () => {
    const key = service.buildNoteFileKey(4, 9, 'quarterly report.pdf');

    expect(key).toMatch(/^projects\/4\/notes\/9\/\d+\.pdf$/);
  });

  it('stores objects with their content type', async () => {
    const buffer = Buffer.from('bytes');

    await service.put('some/key', {
      buffer,
      size: buffer.length,
      mimeType: 'text/plain',
    });

    expect(mockClient.putObject).toHaveBeenCalledWith(
      'test-bucket',
      'some/key',
      buffer,
      buffer.length,
      { 'Content-Type': 'text/plain' },
    );
  });

  it('reads and removes objects from the configured bucket', async () => {
    await service.get('some/key');
    await service.remove('some/key');

    expect(mockClient.getObject).toHaveBeenCalledWith(
      'test-bucket',
      'some/key',
    );
    expect(mockClient.removeObject).toHaveBeenCalledWith(
      'test-bucket',
      'some/key',
    );
  });
});
