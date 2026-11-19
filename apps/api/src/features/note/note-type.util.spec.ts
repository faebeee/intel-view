import { isSoftwareNoteType, normalizeNoteVersion } from './note-type.util';

describe('isSoftwareNoteType', () => {
  it.each(['standard', 'log', 'file', 'url', 'ip', 'command', 'email'])(
    'treats the built-in %s type as not software',
    (type) => {
      expect(isSoftwareNoteType(type)).toBe(false);
    },
  );

  it.each(['ssh', 'http', 'ftp', 'custom-service'])(
    'treats the custom %s type as software',
    (type) => {
      expect(isSoftwareNoteType(type)).toBe(true);
    },
  );
});

describe('normalizeNoteVersion', () => {
  it('trims the version', () => {
    expect(normalizeNoteVersion('  2.4.57 ')).toBe('2.4.57');
  });

  it('maps an empty or blank version to null', () => {
    expect(normalizeNoteVersion('')).toBeNull();
    expect(normalizeNoteVersion('   ')).toBeNull();
  });

  it('passes null and undefined through', () => {
    expect(normalizeNoteVersion(null)).toBeNull();
    expect(normalizeNoteVersion(undefined)).toBeUndefined();
  });
});
