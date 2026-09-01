import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NoteMcpController } from './note-mcp.controller';
import { NoteService } from '../note/note.service';

describe('NoteMcpController', () => {
  let controller: NoteMcpController;
  const mockNoteService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findHistory: jest.fn(),
    findLocations: jest.fn(),
    findAllLocations: jest.fn(),
    createLogEntry: jest.fn(),
    findLogEntries: jest.fn(),
    addRelation: jest.fn(),
    removeRelation: jest.fn(),
  };

  function buildNote(overrides = {}) {
    return {
      id: 1,
      projectId: 10,
      type: 'standard',
      title: 'Sighting',
      content: 'hello world',
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
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      ...overrides,
    };
  }

  function parseResult(result: { content: [{ type: 'text'; text: string }] }) {
    return JSON.parse(result.content[0].text) as unknown;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteMcpController],
      providers: [{ provide: NoteService, useValue: mockNoteService }],
    }).compile();

    controller = module.get<NoteMcpController>(NoteMcpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createNote', () => {
    it('creates a note and returns it as a text tool result', async () => {
      mockNoteService.create.mockResolvedValue(buildNote());

      const result = await controller.createNote({
        projectId: 10,
        title: 'Sighting',
        content: 'hello world',
      });

      expect(mockNoteService.create).toHaveBeenCalledWith(10, {
        title: 'Sighting',
        content: 'hello world',
      });
      expect(parseResult(result)).toMatchObject({
        id: 1,
        title: 'Sighting',
      });
    });
  });

  describe('listNotes', () => {
    it('lists notes, mapping each to a response DTO', async () => {
      mockNoteService.findAll.mockResolvedValue({
        data: [buildNote()],
        meta: { totalItems: 1 },
      });

      const result = await controller.listNotes({
        projectId: 10,
        page: 1,
        limit: 10,
      });

      expect(mockNoteService.findAll).toHaveBeenCalledWith(
        10,
        expect.objectContaining({ page: 1, limit: 10 }),
      );
      expect(parseResult(result)).toMatchObject({
        meta: { totalItems: 1 },
        data: [{ id: 1, title: 'Sighting' }],
      });
    });
  });

  describe('getNote', () => {
    it('returns the note when found', async () => {
      mockNoteService.findOne.mockResolvedValue(buildNote());

      const result = await controller.getNote({ projectId: 10, id: 1 });

      expect(mockNoteService.findOne).toHaveBeenCalledWith(10, 1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findOne.mockResolvedValue(null);

      await expect(
        controller.getNote({ projectId: 10, id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateNote', () => {
    it('updates the note and returns it', async () => {
      mockNoteService.update.mockResolvedValue(buildNote({ title: 'Renamed' }));

      const result = await controller.updateNote({
        projectId: 10,
        id: 1,
        title: 'Renamed',
      });

      expect(mockNoteService.update).toHaveBeenCalledWith(10, 1, {
        title: 'Renamed',
      });
      expect(parseResult(result)).toMatchObject({ title: 'Renamed' });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.update.mockResolvedValue(null);

      await expect(
        controller.updateNote({ projectId: 10, id: 99, title: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteNote', () => {
    it('deletes the note', async () => {
      mockNoteService.remove.mockResolvedValue(true);

      const result = await controller.deleteNote({ projectId: 10, id: 1 });

      expect(mockNoteService.remove).toHaveBeenCalledWith(10, 1);
      expect(parseResult(result)).toEqual({
        message: 'Note with ID 1 successfully deleted',
      });
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.remove.mockResolvedValue(false);

      await expect(
        controller.deleteNote({ projectId: 10, id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addNoteParent', () => {
    it('adds a parent relation and returns the updated note', async () => {
      mockNoteService.findOne.mockResolvedValue(buildNote({ parentIds: [5] }));

      const result = await controller.addNoteParent({
        projectId: 10,
        id: 1,
        relatedId: 5,
      });

      expect(mockNoteService.addRelation).toHaveBeenCalledWith(10, 5, 1);
      expect(parseResult(result)).toMatchObject({ parentIds: [5] });
    });
  });

  describe('removeNoteParent', () => {
    it('removes a parent relation and returns the updated note', async () => {
      mockNoteService.findOne.mockResolvedValue(buildNote());

      const result = await controller.removeNoteParent({
        projectId: 10,
        id: 1,
        relatedId: 5,
      });

      expect(mockNoteService.removeRelation).toHaveBeenCalledWith(10, 5, 1);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });
  });

  describe('addNoteChild', () => {
    it('adds a child relation and returns the updated note', async () => {
      mockNoteService.findOne.mockResolvedValue(buildNote({ childIds: [7] }));

      const result = await controller.addNoteChild({
        projectId: 10,
        id: 1,
        relatedId: 7,
      });

      expect(mockNoteService.addRelation).toHaveBeenCalledWith(10, 1, 7);
      expect(parseResult(result)).toMatchObject({ childIds: [7] });
    });
  });

  describe('removeNoteChild', () => {
    it('removes a child relation and returns the updated note', async () => {
      mockNoteService.findOne.mockResolvedValue(buildNote());

      const result = await controller.removeNoteChild({
        projectId: 10,
        id: 1,
        relatedId: 7,
      });

      expect(mockNoteService.removeRelation).toHaveBeenCalledWith(10, 1, 7);
      expect(parseResult(result)).toMatchObject({ id: 1 });
    });
  });

  describe('getNoteHistory', () => {
    it('returns the note history', async () => {
      const entry = {
        id: 1,
        noteId: 1,
        changeType: 'created',
        changes: null,
        relatedNoteId: null,
        direction: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      mockNoteService.findHistory.mockResolvedValue([entry]);

      const result = await controller.getNoteHistory({
        projectId: 10,
        id: 1,
      });

      expect(mockNoteService.findHistory).toHaveBeenCalledWith(10, 1);
      expect(parseResult(result)).toEqual([
        {
          id: 1,
          noteId: 1,
          changeType: 'created',
          changes: null,
          relatedNoteId: null,
          direction: null,
          createdAt: entry.createdAt.toISOString(),
        },
      ]);
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findHistory.mockResolvedValue(null);

      await expect(
        controller.getNoteHistory({ projectId: 10, id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createNoteLogEntry', () => {
    it('creates a log entry', async () => {
      const entry = {
        id: 1,
        noteId: 1,
        content: 'entry text',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      mockNoteService.createLogEntry.mockResolvedValue(entry);

      const result = await controller.createNoteLogEntry({
        projectId: 10,
        id: 1,
        content: 'entry text',
      });

      expect(mockNoteService.createLogEntry).toHaveBeenCalledWith(10, 1, {
        content: 'entry text',
      });
      expect(parseResult(result)).toMatchObject({ content: 'entry text' });
    });
  });

  describe('listNoteLogEntries', () => {
    it('lists log entries', async () => {
      const entry = {
        id: 1,
        noteId: 1,
        content: 'entry text',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      mockNoteService.findLogEntries.mockResolvedValue([entry]);

      const result = await controller.listNoteLogEntries({
        projectId: 10,
        id: 1,
      });

      expect(mockNoteService.findLogEntries).toHaveBeenCalledWith(10, 1);
      expect(parseResult(result)).toMatchObject([{ content: 'entry text' }]);
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findLogEntries.mockResolvedValue(null);

      await expect(
        controller.listNoteLogEntries({ projectId: 10, id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getNoteLocations', () => {
    it('returns the note locations', async () => {
      mockNoteService.findLocations.mockResolvedValue([
        {
          id: 1,
          noteId: 1,
          lat: 1.1,
          lng: 2.2,
          label: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          noteLabel: 'Sighting',
          tags: [],
          color: null,
        },
      ]);

      const result = await controller.getNoteLocations({
        projectId: 10,
        id: 1,
      });

      expect(mockNoteService.findLocations).toHaveBeenCalledWith(10, 1);
      expect(parseResult(result)).toMatchObject([{ noteLabel: 'Sighting' }]);
    });

    it('throws NotFoundException when the note does not exist', async () => {
      mockNoteService.findLocations.mockResolvedValue(null);

      await expect(
        controller.getNoteLocations({ projectId: 10, id: 99 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAllProjectNoteLocations', () => {
    it('returns all project note locations', async () => {
      mockNoteService.findAllLocations.mockResolvedValue([
        {
          id: 1,
          noteId: 1,
          lat: 1.1,
          lng: 2.2,
          label: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          noteLabel: 'Sighting',
          tags: [],
          color: null,
        },
      ]);

      const result = await controller.listAllProjectNoteLocations({
        projectId: 10,
      });

      expect(mockNoteService.findAllLocations).toHaveBeenCalledWith(10);
      expect(parseResult(result)).toMatchObject([{ noteLabel: 'Sighting' }]);
    });
  });
});
