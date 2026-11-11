import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Note } from '../note/entities/note.entity';
import { PluginRegistryService } from './plugin-registry.service';
import type { NotePlugin } from './plugin.interface';
import { formatCommand, NOTE_PLUGIN } from './plugin.interface';

describe('PluginRegistryService', () => {
  let service: PluginRegistryService;

  const urlPluginPreview = jest.fn().mockReturnValue('fetch snippet result');
  const urlPluginExecute = jest.fn().mockResolvedValue('scan output');
  const urlPluginGetCommand = jest
    .fn()
    .mockReturnValue(['curl', '-sS', 'https://example.com']);
  const urlPlugin: NotePlugin = {
    id: 'url-fetch-snippet',
    label: 'Generate fetch snippet',
    noteTypes: ['url'],
    noteType: 'command',
    executable: true,
    preview: urlPluginPreview,
    execute: urlPluginExecute,
    getCommand: urlPluginGetCommand,
  };
  const standardPlugin: NotePlugin = {
    id: 'standard-only',
    label: 'Standard only plugin',
    noteTypes: ['standard'],
    noteType: 'standard',
    executable: false,
    preview: jest.fn().mockReturnValue('standard result'),
    execute: jest.fn().mockResolvedValue(''),
    getCommand: jest.fn().mockReturnValue(['true']),
  };

  const makeNote = (overrides: Partial<Note> = {}): Note =>
    ({
      id: 1,
      projectId: 1,
      type: 'url',
      title: 'Example',
      content: 'https://example.com',
      tags: [],
      color: null,
      parentIds: [],
      childIds: [],
      canvasX: null,
      canvasY: null,
      fileKey: null,
      fileName: null,
      fileMimeType: null,
      fileSize: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Note;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PluginRegistryService,
        { provide: NOTE_PLUGIN, useValue: [urlPlugin, standardPlugin] },
      ],
    }).compile();

    service = module.get<PluginRegistryService>(PluginRegistryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listForNoteType', () => {
    it('returns only plugins applicable to the given note type', () => {
      expect(service.listForNoteType('url')).toEqual([urlPlugin]);
      expect(service.listForNoteType('standard')).toEqual([standardPlugin]);
      expect(service.listForNoteType('log')).toEqual([]);
    });
  });

  describe('getPlugin', () => {
    it('returns the plugin with the given id', () => {
      expect(service.getPlugin('url-fetch-snippet')).toBe(urlPlugin);
    });

    it('returns undefined when no plugin has that id', () => {
      expect(service.getPlugin('nonexistent')).toBeUndefined();
    });
  });

  describe('getCommand', () => {
    it('returns the plugin argv array', () => {
      const note = makeNote();
      expect(service.getCommand(urlPlugin, note)).toEqual([
        'curl',
        '-sS',
        'https://example.com',
      ]);
      expect(urlPluginGetCommand).toHaveBeenCalledWith(note);
    });
  });

  describe('getCommandString', () => {
    it('renders the argv array for display', () => {
      expect(service.getCommandString(urlPlugin, makeNote())).toBe(
        'curl -sS https://example.com',
      );
    });

    it('quotes elements containing shell metacharacters', () => {
      urlPluginGetCommand.mockReturnValueOnce([
        'curl',
        'https://example.com; rm -rf /',
      ]);

      expect(service.getCommandString(urlPlugin, makeNote())).toBe(
        "curl 'https://example.com; rm -rf /'",
      );
    });
  });

  describe('preview', () => {
    it('previews the given plugin and returns its result', async () => {
      const note = makeNote();
      const result = await service.preview(urlPlugin, note);
      expect(result).toBe('fetch snippet result');
      expect(urlPluginPreview).toHaveBeenCalledWith(note);
    });
  });

  describe('execute', () => {
    it('passes the argv array to the plugin and returns its output', async () => {
      const note = makeNote();

      await expect(service.execute(note, urlPlugin)).resolves.toBe(
        'scan output',
      );
      expect(urlPluginExecute).toHaveBeenCalledWith([
        'curl',
        '-sS',
        'https://example.com',
      ]);
    });

    it('reports a failed command as content rather than throwing', async () => {
      urlPluginExecute.mockRejectedValueOnce(new Error('exit status 1'));

      const result = await service.execute(makeNote(), urlPlugin);

      expect(result).toContain("Command 'curl -sS https://example.com' failed");
      expect(result).toContain('exit status 1');
    });

    it('rethrows infrastructure faults instead of persisting them as content', async () => {
      urlPluginExecute.mockRejectedValueOnce(
        new ServiceUnavailableException('runtime unavailable'),
      );

      await expect(service.execute(makeNote(), urlPlugin)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});

describe('formatCommand', () => {
  it('leaves safe arguments unquoted', () => {
    expect(formatCommand(['nmap', '-sV', '-p-', '1.1.1.1'])).toBe(
      'nmap -sV -p- 1.1.1.1',
    );
  });

  it('quotes arguments containing spaces or metacharacters', () => {
    expect(formatCommand(['echo', 'hello world'])).toBe("echo 'hello world'");
    expect(formatCommand(['echo', '$(id)'])).toBe("echo '$(id)'");
  });

  it('escapes embedded single quotes', () => {
    expect(formatCommand(['echo', "it's"])).toBe("echo 'it'\\''s'");
  });

  it('renders an empty argv as an empty string', () => {
    expect(formatCommand([])).toBe('');
  });
});
