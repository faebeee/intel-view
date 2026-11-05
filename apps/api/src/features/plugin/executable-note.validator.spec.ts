import { BadRequestException } from '@nestjs/common';
import type { Note } from '../note/entities/note.entity';
import { assertExecutableNote } from './executable-note.validator';

const makeNote = (overrides: Partial<Note> = {}): Note =>
  ({
    id: 1,
    projectId: 1,
    type: 'ip',
    title: 'Target',
    content: '1.1.1.1',
    ...overrides,
  }) as Note;

describe('assertExecutableNote', () => {
  describe('ip notes', () => {
    it.each(['1.1.1.1', '192.168.0.1', '::1', '2001:db8::1'])(
      'accepts the valid address %s',
      (content) => {
        expect(() => assertExecutableNote(makeNote({ content }))).not.toThrow();
      },
    );

    it('accepts an address with surrounding whitespace', () => {
      expect(() =>
        assertExecutableNote(makeNote({ content: '  1.1.1.1\n' })),
      ).not.toThrow();
    });

    it.each([
      ['shell injection', '1.1.1.1; touch /tmp/pwned'],
      ['command substitution', '$(touch /tmp/pwned)'],
      ['nmap script flag injection', '--script=http-vuln'],
      ['nmap output flag injection', '-oN /etc/cron.d/x'],
      ['leading dash', '-1.1.1.1'],
      ['hostname', 'example.com'],
      ['CIDR range', '1.1.1.0/24'],
      ['multiple targets', '1.1.1.1 8.8.8.8'],
      ['empty', ''],
      ['whitespace only', '   '],
    ])('rejects %s', (_, content) => {
      expect(() => assertExecutableNote(makeNote({ content }))).toThrow(
        BadRequestException,
      );
    });

    it('rejects missing content', () => {
      expect(() =>
        assertExecutableNote(
          makeNote({ content: undefined as unknown as string }),
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe('unvalidated note types', () => {
    it('passes through note types without a registered validator', () => {
      expect(() =>
        assertExecutableNote(
          makeNote({ type: 'standard', content: 'anything at all; rm -rf /' }),
        ),
      ).not.toThrow();
    });
  });
});
