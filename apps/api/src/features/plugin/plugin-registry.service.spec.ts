import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';
import type { NotePlugin } from './plugin.interface';
import type { NoteResponseDto } from '../note/dto/note-response.dto';

describe('PluginRegistryService', () => {
  let service: PluginRegistryService;

  const urlPluginExecute = jest.fn().mockReturnValue('fetch snippet result');
  const urlPlugin: NotePlugin = {
    id: 'url-fetch-snippet',
    label: 'Generate fetch snippet',
    noteTypes: ['url'],
    preview: urlPluginExecute,
  };
  const standardPlugin: NotePlugin = {
    id: 'standard-only',
    label: 'Standard only plugin',
    noteTypes: ['standard'],
    preview: jest.fn().mockReturnValue('standard result'),
  };

  const makeNote = (
    overrides: Partial<NoteResponseDto> = {},
  ): NoteResponseDto => ({
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
    latitude: null,
    longitude: null,
    geocodeStatus: null,
    geocodedLabel: null,
    geocodeError: null,
    fileName: null,
    fileMimeType: null,
    fileSize: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

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

  describe('execute', () => {
    it('executes the matching plugin and returns its result', async () => {
      const note = makeNote();
      const result = await service.execute('url-fetch-snippet', note);
      expect(result).toBe('fetch snippet result');
      expect(urlPluginExecute).toHaveBeenCalledWith(note);
    });

    it('throws NotFoundException if the plugin id does not exist', async () => {
      const note = makeNote();
      await expect(service.execute('nonexistent', note)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if the plugin exists but is not applicable to the note type', async () => {
      const note = makeNote({ type: 'standard' });
      await expect(service.execute('url-fetch-snippet', note)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
