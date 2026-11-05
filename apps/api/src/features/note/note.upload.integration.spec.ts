import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'node:stream';
import type { Server } from 'node:http';
import request from 'supertest';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';

/**
 * Integration coverage for TD-0.7. The unit tests assert the Multer options
 * are built correctly; these drive a real HTTP request through the interceptor
 * to prove the limits actually reject the upload, and with which status.
 *
 * These exercise the defaults: `buildUploadInterceptorOptions()` runs when the
 * controller's decorators are evaluated, so the configuration is fixed at
 * module load and cannot be varied per test here. The env-driven variations
 * are covered in `upload.config.spec.ts`.
 */
describe('Note file transfer (TD-0.7)', () => {
  let app: INestApplication;
  const mockNoteService = {
    uploadFile: jest.fn(),
    downloadFile: jest.fn(),
  };

  const uploadedNote = {
    id: 3,
    projectId: 1,
    type: 'file',
    title: 'Evidence',
    content: '',
    tags: [],
    color: null,
    canvasX: null,
    canvasY: null,
    fileName: 'ok.png',
    fileMimeType: 'image/png',
    fileSize: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: mockNoteService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockNoteService.uploadFile.mockResolvedValue(uploadedNote);
  });

  const server = (): Server => app.getHttpServer() as Server;

  const upload = (
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): request.Test =>
    request(server())
      .post('/projects/1/notes/3/file')
      .attach('file', buffer, { filename, contentType });

  it('accepts a small, allowlisted file', async () => {
    await upload(Buffer.alloc(1024), 'ok.png', 'image/png').expect(201);
    expect(mockNoteService.uploadFile).toHaveBeenCalled();
  });

  it('rejects an oversized upload with 413 and never reaches the service', async () => {
    // Comfortably over the 25 MiB default ceiling.
    const oversized = Buffer.alloc(26 * 1024 * 1024);

    await upload(oversized, 'huge.png', 'image/png').expect(413);

    // The point of the limit: the service never gets to buffer it.
    expect(mockNoteService.uploadFile).not.toHaveBeenCalled();
  });

  it('rejects a non-allowlisted type with 415, not 500', async () => {
    await upload(
      Buffer.from('<script>alert(1)</script>'),
      'evil.html',
      'text/html',
    ).expect(415);

    expect(mockNoteService.uploadFile).not.toHaveBeenCalled();
  });

  it('still rejects a request with no file at all with 400', async () => {
    await request(server()).post('/projects/1/notes/3/file').expect(400);

    expect(mockNoteService.uploadFile).not.toHaveBeenCalled();
  });

  describe('GET /projects/:projectId/notes/:id/file', () => {
    const stub = (fileName: string, mimeType: string): void => {
      mockNoteService.downloadFile.mockResolvedValue({
        stream: Readable.from(['bytes']),
        fileName,
        mimeType,
        size: 5,
      });
    };

    it('always sends X-Content-Type-Options: nosniff', async () => {
      stub('shot.png', 'image/png');

      const response = await request(server())
        .get('/projects/1/notes/3/file')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('serves an uploaded HTML file as a non-executable attachment', async () => {
      stub('evil.html', 'text/html');

      const response = await request(server())
        .get('/projects/1/notes/3/file')
        .expect(200);

      expect(response.headers['content-disposition']).toMatch(/^attachment;/);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('serves an image inline so the web client can render it', async () => {
      stub('shot.png', 'image/png');

      const response = await request(server())
        .get('/projects/1/notes/3/file')
        .expect(200);

      expect(response.headers['content-disposition']).toMatch(/^inline;/);
      expect(response.headers['content-type']).toContain('image/png');
    });
  });
});
