import {
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NoteService } from '../note/note.service';
import { toNoteResponseDto } from '../note/dto/note-response.dto';
import { PluginRegistryService } from './plugin-registry.service';
import { PluginResponseDto } from './dto/plugin-response.dto';
import { PluginExecuteResponseDto } from './dto/plugin-execute-response.dto';
import { PluginCommandResponseDto } from './dto/plugin-command-response.dto';

@ApiTags('plugins')
@Controller('projects/:projectId/notes/:noteId/plugins')
export class PluginController {
  constructor(
    private readonly noteService: NoteService,
    private readonly pluginRegistryService: PluginRegistryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List the plugins available for a note, based on its type',
  })
  @ApiResponse({
    status: 200,
    description: 'The plugins applicable to this note.',
    type: [PluginResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Note not found.' })
  async findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ): Promise<PluginResponseDto[]> {
    const note = await this.noteService.findOne(projectId, noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }
    return this.pluginRegistryService
      .listForNoteType(note.type)
      .map((plugin) => ({ id: plugin.id, label: plugin.label }));
  }

  @Get(':pluginId/command')
  @ApiOperation({
    summary: 'Get the command that a plugin would execute for a note',
  })
  @ApiResponse({
    status: 200,
    description: 'The command string.',
    type: PluginCommandResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Note or plugin not found.' })
  async getCommand(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginCommandResponseDto> {
    const note = await this.noteService.findOne(projectId, noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }
    const command = this.pluginRegistryService.getCommand(
      pluginId,
      toNoteResponseDto(note),
    );
    return { command };
  }
  @Post(':pluginId/execute-and-create')
  @ApiOperation({
    summary: 'Execute a plugin and create a new child note with the result',
  })
  @ApiResponse({
    status: 201,
    description: 'The newly created note.',
  })
  @ApiResponse({ status: 404, description: 'Note or plugin not found.' })
  async executeAndCreate(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Param('pluginId') pluginId: string,
  ) {
    return this.pluginRegistryService.executeAndCreate(
      projectId,
      noteId,
      pluginId,
    );
  }

  @Post(':pluginId/preview')
  @ApiOperation({
    summary:
      'Execute a plugin against a note, returning its generated string result',
  })
  @ApiResponse({
    status: 201,
    description: "The plugin's generated result.",
    type: PluginExecuteResponseDto,
  })
  @ApiResponse({
    status: 404,
    description:
      'Note not found, or the plugin does not exist/is not applicable to this note.',
  })
  async preview(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Param('pluginId') pluginId: string,
  ): Promise<PluginExecuteResponseDto> {
    const note = await this.noteService.findOne(projectId, noteId);
    if (!note) {
      throw new NotFoundException(`Note with ID ${noteId} not found`);
    }
    const result = await this.pluginRegistryService.preview(
      pluginId,
      toNoteResponseDto(note),
    );
    return { result };
  }
}
