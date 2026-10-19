import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NoteService } from '../note/note.service';
import type { Note } from '../note/entities/note.entity';

describe('PluginController', () => {
  let controller: PluginController;
  const mockNoteService = {
    findOne: jest.fn(),
  };
  const mockPluginRegistryService = {
    listForNoteType: jest.fn(),
    execute: jest.fn(),
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
      latitude: null,
      longitude: null,
      geocodeStatus: null,
      geocodedLabel: null,
      geocodeError: null,
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
      controllers: [PluginController],
      providers: [
        { provide: NoteService, useValue: mockNoteService },
        { provide: PluginRegistryService, useValue: mockPluginRegistryService },
      ],
    }).compile();

    controller = module.get<PluginController>(PluginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('returns the plugins applicable to the note', async () => {
      const note = makeNote();
      mockNoteService.findOne.mockResolvedValue(note);
      mockPluginRegistryService.listForNoteType.mockReturnValue([
        { id: 'url-fetch-snippet', label: 'Generate fetch snippet' },
      ]);

      const result = await controller.findAll(1, 1);

      expect(mockNoteService.findOne).toHaveBeenCalledWith(1, 1);
      expect(mockPluginRegistryService.listForNoteType).toHaveBeenCalledWith(
        'url',
      );
      expect(result).toEqual([
        { id: 'url-fetch-snippet', label: 'Generate fetch snippet' },
      ]);
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);
      await expect(controller.findAll(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('execute', () => {
    it('executes the plugin and returns its result', async () => {
      const note = makeNote();
      mockNoteService.findOne.mockResolvedValue(note);
      mockPluginRegistryService.execute.mockResolvedValue('snippet result');

      const result = await controller.execute(1, 1, 'url-fetch-snippet');

      expect(mockPluginRegistryService.execute).toHaveBeenCalledWith(
        'url-fetch-snippet',
        expect.objectContaining({ id: 1, type: 'url' }),
      );
      expect(result).toEqual({ result: 'snippet result' });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);
      await expect(
        controller.execute(1, 999, 'url-fetch-snippet'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
