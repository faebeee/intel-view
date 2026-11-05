/**
 * MIME types safe to render inline in a browser.
 *
 * Raster images only. `image/svg+xml` is excluded because SVG executes
 * script — serving one inline from the API origin is stored XSS. The web
 * client only ever renders images inline (`NoteFileEditorPane` uses an `<img>`
 * tag for `image/*`); everything else is offered as a download, so forcing
 * `attachment` for the rest costs nothing.
 */
const INLINE_RENDERABLE_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
];

/**
 * Strips characters that must never reach a response header, and that would
 * otherwise allow header injection or break quoting, from a filename.
 */
function toHeaderSafeFilename(fileName: string): string {
  const sanitized = fileName
    // Control characters, including CR/LF.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    // Quotes and backslashes would terminate or escape the quoted string.
    .replace(/["\\]/g, '')
    // Path separators — a download filename is never a path.
    .replace(/[/\\]/g, '_')
    // Anything non-ASCII goes in the RFC 5987 `filename*` parameter instead.

    .replace(/[^\u0020-\u007e]/g, '_')
    .trim();

  return sanitized.length > 0 ? sanitized : 'download';
}

/**
 * Decides how a stored note file is served back.
 *
 * The upload MIME allowlist is advisory — `file.mimetype` comes from the
 * client's `Content-Type` header — so this is the half of the fix that holds
 * regardless of what was uploaded: anything not known-safe to render is served
 * as an attachment, which browsers will not execute. Pair with a
 * `X-Content-Type-Options: nosniff` response header so the declared type is not
 * second-guessed.
 */
export function resolveDownloadHeaders(
  mimeType: string | null,
  fileName: string,
): { type: string; disposition: string } {
  const normalized = (mimeType ?? '').split(';')[0].trim().toLowerCase();
  const type = normalized || 'application/octet-stream';
  const inline = INLINE_RENDERABLE_TYPES.includes(type);

  const safeName = toHeaderSafeFilename(fileName);
  const encodedName = encodeURIComponent(fileName);

  return {
    type,
    disposition: `${inline ? 'inline' : 'attachment'}; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
  };
}
