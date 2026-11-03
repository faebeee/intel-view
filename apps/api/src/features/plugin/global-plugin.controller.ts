import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PluginRegistryService } from './plugin-registry.service';
import { PluginResponseDto } from './dto/plugin-response.dto';
import { PluginExecuteResponseDto } from './dto/plugin-execute-response.dto';
import { PluginExecuteRequestDto } from './dto/plugin-execute-request.dto';

@ApiTags('plugins')
@Controller('projects/:projectId/plugins')
export class GlobalPluginController {
  constructor(
    private readonly pluginRegistryService: PluginRegistryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all available plugins',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all registered plugins.',
    type: [PluginResponseDto],
  })
  async findAllPlugins(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<PluginResponseDto[]> {
    return this.pluginRegistryService
      .listAllPlugins()
      .map((plugin) => ({ id: plugin.id, label: plugin.label }));
  }

  @Post(':pluginId/execute')
  @ApiOperation({
    summary: 'Execute a plugin with a command, returning the output',
  })
  @ApiResponse({
    status: 201,
    description: 'The plugin execution result.',
    type: PluginExecuteResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plugin not found.' })
  async execute(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('pluginId') pluginId: string,
    @Body() body: PluginExecuteRequestDto,
  ): Promise<PluginExecuteResponseDto> {
    const result = await this.pluginRegistryService.execute(
      pluginId,
      body.command,
    );
    return { result };
  }
}
