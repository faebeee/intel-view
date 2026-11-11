import { resolveDownloadHeaders } from './download.config';

describe('resolveDownloadHeaders', () => {
  describe('disposition', () => {
    it.each([
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/avif',
    ])('serves %s inline, so the web client can render it', (mimeType) => {
      expect(resolveDownloadHeaders(mimeType, 'shot.png').disposition).toMatch(
        /^inline;/,
      );
    });

    it.each([
      ['text/html', 'report.html'],
      ['image/svg+xml', 'logo.svg'],
      ['application/xhtml+xml', 'page.xhtml'],
      ['text/javascript', 'payload.js'],
      ['application/pdf', 'report.pdf'],
      ['application/octet-stream', 'dump.bin'],
    ])(
      'forces an attachment for %s, so the browser will not execute it',
      (mimeType, fileName) => {
        expect(resolveDownloadHeaders(mimeType, fileName).disposition).toMatch(
          /^attachment;/,
        );
      },
    );

    it('forces an attachment when the stored type is unknown', () => {
      const headers = resolveDownloadHeaders(null, 'mystery');
      expect(headers.type).toBe('application/octet-stream');
      expect(headers.disposition).toMatch(/^attachment;/);
    });
  });

  describe('content type', () => {
    it('normalises case and strips parameters', () => {
      expect(resolveDownloadHeaders('IMAGE/PNG; q=1', 'a.png').type).toBe(
        'image/png',
      );
    });

    it('is still inline-safe only for the exact normalised type', () => {
      // `image/svg+xml` starts with `image/` but must never be inline.
      expect(
        resolveDownloadHeaders('IMAGE/SVG+XML', 'a.svg').disposition,
      ).toMatch(/^attachment;/);
    });
  });

  describe('filename', () => {
    it('quotes the ASCII name and adds an RFC 5987 encoded parameter', () => {
      expect(resolveDownloadHeaders('image/png', 'shot.png').disposition).toBe(
        `inline; filename="shot.png"; filename*=UTF-8''shot.png`,
      );
    });

    it('strips CR/LF so a filename cannot inject response headers', () => {
      const { disposition } = resolveDownloadHeaders(
        'application/pdf',
        'a\r\nSet-Cookie: evil=1.pdf',
      );
      expect(disposition).not.toContain('\r');
      expect(disposition).not.toContain('\n');
      expect(disposition).toContain('filename="aSet-Cookie: evil=1.pdf"');
    });

    it('strips quotes and backslashes that would break the quoted string', () => {
      const { disposition } = resolveDownloadHeaders(
        'application/pdf',
        'a"; x="b.pdf',
      );
      expect(disposition).toContain('filename="a; x=b.pdf"');
    });

    it('replaces path separators', () => {
      expect(
        resolveDownloadHeaders('application/pdf', '../../etc/passwd')
          .disposition,
      ).toContain('filename=".._.._etc_passwd"');
    });

    it('preserves a non-ASCII name in the encoded parameter', () => {
      const { disposition } = resolveDownloadHeaders(
        'application/pdf',
        'Bericht-Ü.pdf',
      );
      expect(disposition).toContain('filename="Bericht-_.pdf"');
      expect(disposition).toContain(
        `filename*=UTF-8''${encodeURIComponent('Bericht-Ü.pdf')}`,
      );
    });

    it('falls back to a placeholder when nothing survives sanitising', () => {
      expect(
        resolveDownloadHeaders('application/pdf', '\r\n').disposition,
      ).toContain('filename="download"');
    });
  });
});
