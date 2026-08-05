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
import { Note } from './entities/note.entity';

@ApiTags('notes')
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note' })
  @ApiResponse({
    status: 201,
    description: 'The note has been successfully created.',
    type: Note,
  })
  async create(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
    return this.noteService.create(createNoteDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active notes with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(notePaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active notes paginated.',
  })
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Note>> {
    return this.noteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the note with the specified ID.',
    type: Note,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Note> {
    const note = await this.noteService.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a note by ID' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully updated.',
    type: Note,
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
  ): Promise<Note> {
    const note = await this.noteService.update(id, updateNoteDto);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a note by ID' })
  @ApiResponse({
    status: 200,
    description: 'The note has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.noteService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return { message: `Note with ID ${id} successfully deleted` };
  }
}
