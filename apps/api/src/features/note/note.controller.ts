import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Paginate, Paginated, ApiPaginationQuery } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { NoteService, notePaginateConfig } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { CreateNoteLogEntryDto } from './dto/create-note-log-entry.dto';
import { NoteResponseDto, toNoteResponseDto } from './dto/note-response.dto';
import {
  NoteHistoryEntryResponseDto,
  toNoteHistoryEntryResponseDto,
} from './dto/note-history-entry-response.dto';
import {
  NoteLogEntryResponseDto,
  toNoteLogEntryResponseDto,
} from './dto/note-log-entry-response.dto';
import {
  NoteLocationResponseDto,
  toNoteLocationResponseDto,
} from './dto/note-location-response.dto';

@ApiTags('notes')
@Controller('projects/:projectId/notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note in a project' })
  @ApiResponse({
    status: 201,
    description: 'The note has been successfully created.',
    type: NoteResponseDto,
  })
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() createNoteDto: CreateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.noteService.create(projectId, createNoteDto);
    return toNoteResponseDto(note);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all active notes in a project with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(notePaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active notes in the project, paginated.',
  })
  async findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<NoteResponseDto>> {
    const paginated = await this.noteService.findAll(projectId, query);
    return {
      ...paginated,
      data: paginated.data.map(toNoteResponseDto),
    } as unknown as Paginated<NoteResponseDto>;
  }

  @Get('locations')
  @ApiOperation({
    summary:
      "Get every active note's geographic pins across the whole project, each with its owning note's derived label",
  })
  @ApiResponse({
    status: 200,
    description: 'All derived note locations in the project.',
    type: [NoteLocationResponseDto],
  })
  async findAllLocations(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<NoteLocationResponseDto[]> {
    const locations = await this.noteService.findAllLocations(projectId);
    return locations.map((location) =>
      toNoteLocationResponseDto(location, {
        noteLabel: location.noteLabel,
        tags: location.tags,
      }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by ID within a project' })
  @ApiResponse({
    status: 200,
    description: 'Return the note with the specified ID.',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteResponseDto> {
    const note = await this.noteService.findOne(projectId, id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return toNoteResponseDto(note);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note by ID within a project' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully updated.',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const note = await this.noteService.update(projectId, id, updateNoteDto);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return toNoteResponseDto(note);
  }

  @Get(':id/history')
  @ApiOperation({
    summary:
      'Get the full automatic change history of a note, most recent first',
  })
  @ApiResponse({
    status: 200,
    description: "The note's change history.",
    type: [NoteHistoryEntryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findHistory(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteHistoryEntryResponseDto[]> {
    const history = await this.noteService.findHistory(projectId, id);
    if (!history) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return history.map(toNoteHistoryEntryResponseDto);
  }

  @Post(':id/log-entries')
  @ApiOperation({
    summary:
      "Append a new entry to a 'log'-type note's log. 400 if the note isn't type 'log'.",
  })
  @ApiResponse({
    status: 201,
    description: 'The log entry has been successfully created.',
    type: NoteLogEntryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  @ApiResponse({ status: 400, description: "Note is not of type 'log'." })
  async createLogEntry(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() createNoteLogEntryDto: CreateNoteLogEntryDto,
  ): Promise<NoteLogEntryResponseDto> {
    const entry = await this.noteService.createLogEntry(
      projectId,
      id,
      createNoteLogEntryDto,
    );
    return toNoteLogEntryResponseDto(entry);
  }

  @Get(':id/log-entries')
  @ApiOperation({
    summary: "Get all of a 'log'-type note's entries, most recent first",
  })
  @ApiResponse({
    status: 200,
    description: "The note's log entries.",
    type: [NoteLogEntryResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findLogEntries(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteLogEntryResponseDto[]> {
    const entries = await this.noteService.findLogEntries(projectId, id);
    if (!entries) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return entries.map(toNoteLogEntryResponseDto);
  }

  @Get(':id/locations')
  @ApiOperation({
    summary:
      "Get the geographic pins embedded in a note's content via [[geo:...]] tokens",
  })
  @ApiResponse({
    status: 200,
    description: "The note's derived locations.",
    type: [NoteLocationResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findLocations(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<NoteLocationResponseDto[]> {
    const locations = await this.noteService.findLocations(projectId, id);
    if (!locations) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return locations.map((location) =>
      toNoteLocationResponseDto(location, {
        noteLabel: location.noteLabel,
        tags: location.tags,
      }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a note by ID within a project' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.noteService.remove(projectId, id);
    if (!deleted) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return { message: `Note with ID ${id} successfully deleted` };
  }
}
