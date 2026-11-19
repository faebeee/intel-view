import { remapNoteReferences } from './note-references.util';

describe('remapNoteReferences', () => {
  const idMap = new Map<number, number>([
    [1, 101],
    [2, 102],
  ]);

  it('rewrites references to mapped ids', () => {
    expect(remapNoteReferences('a [[1]] b [[ #2 ]]', idMap)).toBe(
      'a [[101]] b [[102]]',
    );
  });

  it('leaves references to unmapped ids untouched', () => {
    expect(remapNoteReferences('see [[#3]]', idMap)).toBe('see [[#3]]');
  });

  it('returns text without references unchanged', () => {
    expect(remapNoteReferences('plain text', idMap)).toBe('plain text');
  });
});
