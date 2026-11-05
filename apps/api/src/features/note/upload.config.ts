import { UnsupportedMediaTypeException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Default ceiling on a single upload, in bytes.
 *
 * Multer buffers the whole file in memory (`NoteService.uploadFile` reads
 * `file.buffer`), so an unbounded upload is a trivial OOM denial of service.
 */
export const DEFAULT_MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/**
 * MIME types accepted by default.
 *
 * Chosen for penetration-test evidence — screenshots, reports, captures, tool
 * output, archives — while omitting the types that are dangerous to render in
 * a browser (`text/html`, `image/svg+xml`, `application/xhtml+xml`). Note this
 * is a guard rail, not a security boundary on its own: `file.mimetype` is the
 * client's `Content-Type` header and is trivially forged. The non-bypassable
 * half of the fix is in how `GET /:id/file` serves the bytes back — see
 * `resolveDownloadHeaders`.
 */
export const DEFAULT_MIME_ALLOWLIST: readonly string[] = [
  // Images (deliberately excluding image/svg+xml — SVG executes script).
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  // Documents and reports.
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text and structured tool output.
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'application/xml',
  'text/xml',
  // Archives.
  'application/zip',
  'application/gzip',
  'application/x-tar',
  'application/x-7z-compressed',
  'application/vnd.rar',
  // Network captures.
  'application/vnd.tcpdump.pcap',
  'application/x-pcapng',
  // Generic binary — tool output and unrecognised evidence files.
  'application/octet-stream',
];

/** Parses a positive-integer environment variable, ignoring junk values. */
function readPositiveIntEnv(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value.trim());
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
}

/**
 * Maximum accepted upload size in bytes, from `MAX_UPLOAD_BYTES`. A missing or
 * unparseable value falls back to the default rather than to "unlimited".
 */
export function getMaxUploadBytes(
  env: NodeJS.ProcessEnv = process.env,
): number {
  return readPositiveIntEnv(env.MAX_UPLOAD_BYTES) ?? DEFAULT_MAX_UPLOAD_BYTES;
}

/**
 * Accepted MIME types, from the comma-separated `UPLOAD_MIME_ALLOWLIST`.
 *
 * Set it to `*` to accept any type — an explicit, greppable opt-out for
 * deployments that need to store arbitrary evidence.
 */
export function getMimeAllowlist(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const raw = env.UPLOAD_MIME_ALLOWLIST?.trim();
  if (!raw) {
    return [...DEFAULT_MIME_ALLOWLIST];
  }
  const entries = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  return entries.length > 0 ? entries : [...DEFAULT_MIME_ALLOWLIST];
}

/**
 * Whether `mimeType` is covered by `allowlist`. Supports an exact match, a
 * `type/*` wildcard, and the catch-all `*`.
 */
export function isMimeAllowed(
  mimeType: string | undefined,
  allowlist: readonly string[],
): boolean {
  if (allowlist.includes('*')) {
    return true;
  }
  if (!mimeType) {
    return false;
  }
  // Strip any parameters, e.g. `text/plain; charset=utf-8`.
  const normalized = mimeType.split(';')[0].trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (allowlist.includes(normalized)) {
    return true;
  }
  const type = normalized.split('/')[0];
  return allowlist.includes(`${type}/*`);
}

/**
 * Multer options for the note file upload: a hard size limit plus the MIME
 * allowlist.
 *
 * `limits.files`/`limits.fields` are set too, so a multipart body cannot smuggle
 * in unbounded extra parts that Multer would still parse.
 */
export function buildUploadInterceptorOptions(
  env: NodeJS.ProcessEnv = process.env,
): MulterOptions {
  const maxBytes = getMaxUploadBytes(env);
  const allowlist = getMimeAllowlist(env);

  return {
    limits: {
      fileSize: maxBytes,
      files: 1,
      fields: 8,
    },
    fileFilter: (_req, file, callback) => {
      if (!isMimeAllowed(file.mimetype, allowlist)) {
        // An HttpException is passed through unchanged by Nest's Multer
        // exception transform, so this surfaces as a 415 rather than a 500.
        callback(
          new UnsupportedMediaTypeException(
            `File type '${file.mimetype}' is not accepted.`,
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
  };
}
