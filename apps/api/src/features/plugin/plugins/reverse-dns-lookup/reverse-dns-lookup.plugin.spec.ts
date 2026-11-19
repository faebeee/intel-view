import { Test, TestingModule } from '@nestjs/testing';
import type { Note } from '../../../note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import { ReverseDnsLookupPlugin } from './reverse-dns-lookup.plugin';

const makeNote = (overrides: Partial<Note> = {}): Note =>
  ({
    id: 1,
    projectId: 1,
    type: 'ip',
    title: 'Target',
    content: '1.1.1.1',
    ...overrides,
  }) as Note;

describe('ReverseDnsLookupPlugin', () => {
  let plugin: ReverseDnsLookupPlugin;
  const mockCommandContainer = { runCommand: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReverseDnsLookupPlugin,
        { provide: CommandContainer, useValue: mockCommandContainer },
      ],
    }).compile();

    plugin = module.get<ReverseDnsLookupPlugin>(ReverseDnsLookupPlugin);
  });

  it('is applicable to ip notes, executable, and creates command notes', () => {
    expect(plugin.noteTypes).toEqual(['ip']);
    expect(plugin.executable).toBe(true);
    expect(plugin.noteType).toBe('command');
  });

  describe('getCommand', () => {
    it('returns the argv for the trimmed target', () => {
      expect(plugin.getCommand(makeNote({ content: ' 1.1.1.1 ' }))).toEqual([
        'dig',
        '-x',
        '1.1.1.1',
        '+noall',
        '+comments',
        '+answer',
      ]);
    });

    it('supports IPv6 targets', () => {
      expect(
        plugin.getCommand(makeNote({ content: '2606:4700:4700::1111' }))[2],
      ).toBe('2606:4700:4700::1111');
    });

    it('never splits hostile content into extra argv elements', () => {
      const argv = plugin.getCommand(
        makeNote({ content: '1.1.1.1; touch /tmp/pwned' }),
      );

      expect(argv).toHaveLength(
        ['dig', '-x', '1.1.1.1', '+noall', '+comments', '+answer'].length,
      );
      expect(argv[2]).toBe('1.1.1.1; touch /tmp/pwned');
    });
  });

  describe('preview', () => {
    it('renders the command that would be executed', () => {
      expect(plugin.preview(makeNote())).toBe(
        'dig -x 1.1.1.1 +noall +comments +answer',
      );
    });

    it('stays in sync with getCommand', () => {
      const note = makeNote();
      expect(plugin.preview(note)).toBe(plugin.getCommand(note).join(' '));
    });
  });

  describe('execute', () => {
    it('delegates the argv array to the command container unchanged', async () => {
      mockCommandContainer.runCommand.mockResolvedValue('lookup output');
      const argv = ['dig', '-x', '1.1.1.1', '+noall', '+comments', '+answer'];

      await expect(plugin.execute(argv)).resolves.toBe('lookup output');
      expect(mockCommandContainer.runCommand).toHaveBeenCalledWith(argv);
    });

    it('propagates container failures', async () => {
      mockCommandContainer.runCommand.mockRejectedValue(new Error('boom'));

      await expect(plugin.execute(['x'])).rejects.toThrow('boom');
    });
  });
});
