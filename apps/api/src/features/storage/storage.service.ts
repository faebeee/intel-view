import { Injectable, Logger } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { Client } from 'minio';
import type { Readable } from 'stream';

/** Everything needed to persist an uploaded file's bytes in object storage. */
export type StoredObject = {
  buffer: Buffer;
  size: number;
  mimeType: string;
};

/**
 * Thin wrapper around the MinIO (S3-compatible) client used to store note
 * file attachments. Connection details come from the `MINIO_*` environment
 * variables, defaulting to the `minio` service defined in the repository's
 * `docker-compose.yml`. Objects are never exposed to clients directly — the
 * API proxies uploads and downloads — so the bucket stays private.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.MINIO_BUCKET || 'intel-view-files';
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  /**
   * Creates the configured bucket on boot if it doesn't exist yet, so a
   * fresh MinIO volume works without any manual provisioning step. Failures
   * are logged rather than thrown: object storage being unreachable should
   * degrade file notes, not prevent the whole API from starting.
   */
  async onModuleInit(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Created object storage bucket "${this.bucket}"`);
      }
    } catch (error) {
      this.logger.error(
        `Could not ensure object storage bucket "${this.bucket}" exists: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Builds the object key a note's file is stored under. Keys are derived
   * from the owning project/note plus a timestamp, so replacing a note's
   * file never overwrites the previous object in place (the old one is
   * deleted explicitly).
   */
  buildNoteFileKey(
    projectId: number,
    noteId: number,
    fileName: string,
  ): string {
    const extension = fileName.includes('.')
      ? `.${fileName.split('.').pop()}`
      : '';
    return `projects/${projectId}/notes/${noteId}/${Date.now()}${extension}`;
  }

  async put(key: string, object: StoredObject): Promise<void> {
    await this.client.putObject(this.bucket, key, object.buffer, object.size, {
      'Content-Type': object.mimeType,
    });
  }

  async get(key: string): Promise<Readable> {
    return this.client.getObject(this.bucket, key);
  }

  async remove(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }
}
