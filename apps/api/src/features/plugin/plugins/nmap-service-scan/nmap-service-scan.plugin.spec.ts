import { Test, TestingModule } from '@nestjs/testing';
import type { Note } from '../../../note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import { NmapServiceScanPlugin } from './nmap-service-scan.plugin';

const makeNote = (overrides: Partial<Note> = {}): Note =>
  ({
    id: 1,
    projectId: 1,
    type: 'ip',
    title: 'Target',
    content: '1.1.1.1',
    ...overrides,
  }) as Note;

describe('NmapServiceScanPlugin', () => {
  let plugin: NmapServiceScanPlugin;
  const mockCommandContainer = { runCommand: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NmapServiceScanPlugin,
        { provide: CommandContainer, useValue: mockCommandContainer },
      ],
    }).compile();

    plugin = module.get<NmapServiceScanPlugin>(NmapServiceScanPlugin);
  });

  it('is applicable to ip notes and is executable', () => {
    expect(plugin.noteTypes).toEqual(['ip']);
    expect(plugin.executable).toBe(true);
  });

  describe('getCommand', () => {
    it('returns argv with the target as a single trailing element', () => {
      expect(plugin.getCommand(makeNote())).toEqual(['nmap', '-sV', '1.1.1.1']);
    });

    it('trims the target', () => {
      expect(plugin.getCommand(makeNote({ content: ' 1.1.1.1 ' }))).toEqual([
        'nmap',
        '-sV',
        '1.1.1.1',
      ]);
    });

    it('never splits hostile content into extra argv elements', () => {
      const argv = plugin.getCommand(
        makeNote({ content: '1.1.1.1; touch /tmp/pwned' }),
      );

      expect(argv).toHaveLength(3);
      expect(argv[2]).toBe('1.1.1.1; touch /tmp/pwned');
    });
  });

  describe('preview', () => {
    it('renders the command that would be executed', () => {
      expect(plugin.preview(makeNote())).toBe('nmap -sV 1.1.1.1');
    });

    it('quotes hostile content so the display form is unambiguous', () => {
      expect(plugin.preview(makeNote({ content: '1.1.1.1; sh' }))).toBe(
        "nmap -sV '1.1.1.1; sh'",
      );
    });

    it('stays in sync with getCommand', () => {
      const note = makeNote();
      expect(plugin.preview(note)).toBe(plugin.getCommand(note).join(' '));
    });
  });

  describe('execute', () => {
    it('delegates the argv array to the command container unchanged', async () => {
      mockCommandContainer.runCommand.mockResolvedValue('scan output');
      const argv = ['nmap', '-sV', '-p-', '1.1.1.1'];

      await expect(plugin.execute(argv)).resolves.toBe('scan output');
      expect(mockCommandContainer.runCommand).toHaveBeenCalledWith(argv);
    });

    it('propagates container failures', async () => {
      mockCommandContainer.runCommand.mockRejectedValue(new Error('boom'));

      await expect(plugin.execute(['nmap'])).rejects.toThrow('boom');
    });
  });
});
