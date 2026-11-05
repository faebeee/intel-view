import { UnsupportedMediaTypeException } from '@nestjs/common';
import {
  buildUploadInterceptorOptions,
  DEFAULT_MAX_UPLOAD_BYTES,
  DEFAULT_MIME_ALLOWLIST,
  getMaxUploadBytes,
  getMimeAllowlist,
  isMimeAllowed,
} from './upload.config';

describe('getMaxUploadBytes', () => {
  it('defaults to the built-in ceiling', () => {
    expect(getMaxUploadBytes({})).toBe(DEFAULT_MAX_UPLOAD_BYTES);
  });

  it('reads MAX_UPLOAD_BYTES', () => {
    expect(getMaxUploadBytes({ MAX_UPLOAD_BYTES: '1048576' })).toBe(1048576);
  });

  it.each(['0', '-1', 'lots', '', '1.5', 'NaN'])(
    'falls back to the default rather than "unlimited" for %p',
    (value) => {
      expect(getMaxUploadBytes({ MAX_UPLOAD_BYTES: value })).toBe(
        DEFAULT_MAX_UPLOAD_BYTES,
      );
    },
  );
});

describe('getMimeAllowlist', () => {
  it('defaults to the built-in allowlist', () => {
    expect(getMimeAllowlist({})).toEqual([...DEFAULT_MIME_ALLOWLIST]);
  });

  it('parses a comma-separated list and normalises case and spacing', () => {
    expect(
      getMimeAllowlist({
        UPLOAD_MIME_ALLOWLIST: 'image/PNG , application/pdf',
      }),
    ).toEqual(['image/png', 'application/pdf']);
  });

  it.each(['', '   ', ',,,'])(
    'falls back to the default for the empty value %p',
    (value) => {
      expect(getMimeAllowlist({ UPLOAD_MIME_ALLOWLIST: value })).toEqual([
        ...DEFAULT_MIME_ALLOWLIST,
      ]);
    },
  );
});

describe('DEFAULT_MIME_ALLOWLIST', () => {
  it.each([
    'text/html',
    'image/svg+xml',
    'application/xhtml+xml',
    'application/javascript',
    'text/javascript',
  ])('omits the browser-executable type %s', (mimeType) => {
    expect(isMimeAllowed(mimeType, DEFAULT_MIME_ALLOWLIST)).toBe(false);
  });

  it.each([
    'image/png',
    'application/pdf',
    'text/plain',
    'application/zip',
    'application/octet-stream',
    'application/vnd.tcpdump.pcap',
  ])('accepts the evidence type %s', (mimeType) => {
    expect(isMimeAllowed(mimeType, DEFAULT_MIME_ALLOWLIST)).toBe(true);
  });
});

describe('isMimeAllowed', () => {
  it('matches exactly', () => {
    expect(isMimeAllowed('image/png', ['image/png'])).toBe(true);
    expect(isMimeAllowed('image/gif', ['image/png'])).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isMimeAllowed('IMAGE/PNG', ['image/png'])).toBe(true);
  });

  it('ignores parameters such as charset', () => {
    expect(isMimeAllowed('text/plain; charset=utf-8', ['text/plain'])).toBe(
      true,
    );
  });

  it('supports a type wildcard', () => {
    expect(isMimeAllowed('image/anything', ['image/*'])).toBe(true);
    expect(isMimeAllowed('text/plain', ['image/*'])).toBe(false);
  });

  it('supports the catch-all opt-out', () => {
    expect(isMimeAllowed('text/html', ['*'])).toBe(true);
    expect(isMimeAllowed(undefined, ['*'])).toBe(true);
  });

  it.each([undefined, '', '   ', ';charset=utf-8'])(
    'rejects the missing or malformed type %p',
    (mimeType) => {
      expect(isMimeAllowed(mimeType, ['image/png'])).toBe(false);
    },
  );
});

describe('buildUploadInterceptorOptions', () => {
  it('sets a file size limit (TD-0.7)', () => {
    const options = buildUploadInterceptorOptions({
      MAX_UPLOAD_BYTES: '1024',
    });
    expect(options.limits?.fileSize).toBe(1024);
  });

  it('caps the number of files and fields in a multipart body', () => {
    const options = buildUploadInterceptorOptions({});
    expect(options.limits?.files).toBe(1);
    expect(options.limits?.fields).toBe(8);
  });

  describe('fileFilter', () => {
    const runFilter = (
      mimetype: string,
      env: NodeJS.ProcessEnv = {},
    ): { error: unknown; accepted: unknown } => {
      const options = buildUploadInterceptorOptions(env);
      let error: unknown;
      let accepted: unknown;
      options.fileFilter?.(
        {},
        { mimetype } as Express.Multer.File,
        (err: unknown, ok: unknown) => {
          error = err;
          accepted = ok;
        },
      );
      return { error, accepted };
    };

    it('accepts an allowlisted type', () => {
      const { error, accepted } = runFilter('image/png');
      expect(error).toBeNull();
      expect(accepted).toBe(true);
    });

    it('rejects a type outside the allowlist with a 415, not a 500', () => {
      const { error, accepted } = runFilter('text/html');
      // An HttpException passes through Nest's Multer exception transform
      // unchanged; a plain Error would surface as a 500.
      expect(error).toBeInstanceOf(UnsupportedMediaTypeException);
      expect(accepted).toBe(false);
    });

    it('honours a configured allowlist', () => {
      expect(
        runFilter('text/html', { UPLOAD_MIME_ALLOWLIST: 'text/html' }).accepted,
      ).toBe(true);
      expect(
        runFilter('image/png', { UPLOAD_MIME_ALLOWLIST: 'text/html' }).accepted,
      ).toBe(false);
    });

    it('accepts anything under the catch-all opt-out', () => {
      expect(
        runFilter('text/html', { UPLOAD_MIME_ALLOWLIST: '*' }).accepted,
      ).toBe(true);
    });
  });
});
