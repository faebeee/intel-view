import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Note } from '../note/entities/note.entity';
import { NoteService } from '../note/note.service';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';

describe('PluginController', () => {
  let controller: PluginController;
  const mockNoteService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockPluginRegistryService = {
    listForNoteType: jest.fn(),
    getPlugin: jest.fn(),
    getCommand: jest.fn(),
    getCommandString: jest.fn(),
    execute: jest.fn(),
    preview: jest.fn(),
  };

  const nmapPlugin = {
    id: 'nmap-service-scan',
    label: 'Nmap Service Scan',
    noteType: 'command',
    noteTypes: ['ip'],
    executable: true,
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

  const makeIpNote = (content: string): Note =>
    makeNote({ type: 'ip', title: 'Target', content });

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
        {
          id: 'url-fetch-snippet',
          label: 'Generate fetch snippet',
          executable: false,
        },
      ]);

      const result = await controller.findAll(1, 1);

      expect(mockNoteService.findOne).toHaveBeenCalledWith(1, 1);
      expect(mockPluginRegistryService.listForNoteType).toHaveBeenCalledWith(
        'url',
      );
      expect(result).toEqual([
        {
          id: 'url-fetch-snippet',
          label: 'Generate fetch snippet',
          executable: false,
        },
      ]);
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);
      await expect(controller.findAll(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCommand', () => {
    it('returns the display form of the command', async () => {
      mockNoteService.findOne.mockResolvedValue(makeIpNote('1.1.1.1'));
      mockPluginRegistryService.getPlugin.mockReturnValue(nmapPlugin);
      mockPluginRegistryService.getCommandString.mockReturnValue(
        'nmap -sV -p- 1.1.1.1',
      );

      await expect(
        controller.getCommand(1, 1, 'nmap-service-scan'),
      ).resolves.toEqual({ command: 'nmap -sV -p- 1.1.1.1' });
    });

    it('throws NotFoundException when the plugin does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(makeNote());
      mockPluginRegistryService.getPlugin.mockReturnValue(undefined);

      await expect(controller.getCommand(1, 1, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('executeAndCreate', () => {
    beforeEach(() => {
      mockPluginRegistryService.getPlugin.mockReturnValue(nmapPlugin);
      mockPluginRegistryService.getCommandString.mockReturnValue(
        'nmap -sV -p- 1.1.1.1',
      );
      mockPluginRegistryService.execute.mockResolvedValue('scan output');
      mockNoteService.create.mockResolvedValue({ id: 2 });
    });

    it('executes the plugin and creates a child note with the result', async () => {
      const note = makeIpNote('1.1.1.1');
      mockNoteService.findOne.mockResolvedValue(note);

      await controller.executeAndCreate(1, 1, 'nmap-service-scan');

      expect(mockPluginRegistryService.execute).toHaveBeenCalledWith(
        note,
        nmapPlugin,
      );
      expect(mockNoteService.create).toHaveBeenCalledWith(1, {
        parentIds: [1],
        type: 'command',
        title: 'nmap -sV -p- 1.1.1.1',
        content: 'scan output',
      });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);

      await expect(
        controller.executeAndCreate(1, 999, 'nmap-service-scan'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPluginRegistryService.execute).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the plugin does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(makeIpNote('1.1.1.1'));
      mockPluginRegistryService.getPlugin.mockReturnValue(undefined);

      await expect(
        controller.executeAndCreate(1, 1, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPluginRegistryService.execute).not.toHaveBeenCalled();
    });

    describe('input validation (TD-0.3)', () => {
      it.each([
        ['shell injection', '1.1.1.1; touch /tmp/pwned'],
        ['command substitution', '$(touch /tmp/pwned)'],
        ['nmap script flag injection', '--script=http-vuln'],
        ['nmap output flag injection', '-oN /etc/cron.d/x'],
        ['a hostname', 'example.com'],
        ['a CIDR range', '1.1.1.0/24'],
      ])(
        'rejects %s with BadRequest and never reaches the runner',
        async (_, content) => {
          mockNoteService.findOne.mockResolvedValue(makeIpNote(content));

          await expect(
            controller.executeAndCreate(1, 1, 'nmap-service-scan'),
          ).rejects.toThrow(BadRequestException);

          expect(mockPluginRegistryService.execute).not.toHaveBeenCalled();
          expect(mockNoteService.create).not.toHaveBeenCalled();
        },
      );

      it('accepts a valid IPv6 target', async () => {
        mockNoteService.findOne.mockResolvedValue(makeIpNote('2001:db8::1'));

        await controller.executeAndCreate(1, 1, 'nmap-service-scan');

        expect(mockPluginRegistryService.execute).toHaveBeenCalled();
      });
    });
  });

  describe('preview', () => {
    it('previews the plugin and returns its result', async () => {
      const note = makeNote();
      mockNoteService.findOne.mockResolvedValue(note);
      mockPluginRegistryService.getPlugin.mockReturnValue(nmapPlugin);
      mockPluginRegistryService.preview.mockResolvedValue('snippet result');

      const result = await controller.preview(1, 1, 'url-fetch-snippet');

      expect(mockPluginRegistryService.preview).toHaveBeenCalledWith(
        nmapPlugin,
        expect.objectContaining({ id: 1, type: 'url' }),
      );
      expect(result).toEqual({ result: 'snippet result' });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);
      await expect(
        controller.preview(1, 999, 'url-fetch-snippet'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the plugin does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(makeNote());
      mockPluginRegistryService.getPlugin.mockReturnValue(undefined);

      await expect(controller.preview(1, 1, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
