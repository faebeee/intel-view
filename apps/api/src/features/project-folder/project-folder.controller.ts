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
import {
  ProjectFolderService,
  projectFolderPaginateConfig,
} from './project-folder.service';
import { CreateProjectFolderDto } from './dto/create-project-folder.dto';
import { UpdateProjectFolderDto } from './dto/update-project-folder.dto';
import {
  ProjectFolderResponseDto,
  toProjectFolderResponseDto,
  UngroupedProjectsCountResponseDto,
} from './dto/project-folder-response.dto';

@ApiTags('project-folders')
@Controller('project-folders')
export class ProjectFolderController {
  constructor(private readonly projectFolderService: ProjectFolderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project folder' })
  @ApiResponse({
    status: 201,
    description: 'The project folder has been successfully created.',
    type: ProjectFolderResponseDto,
  })
  async create(
    @Body() createProjectFolderDto: CreateProjectFolderDto,
  ): Promise<ProjectFolderResponseDto> {
    const folder = await this.projectFolderService.create(createProjectFolderDto);
    return toProjectFolderResponseDto(folder);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all active project folders with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(projectFolderPaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active project folders paginated.',
  })
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ProjectFolderResponseDto>> {
    const paginated = await this.projectFolderService.findAll(query);
    const { countsByFolderId } =
      await this.projectFolderService.countProjectsByFolder();
    return {
      ...paginated,
      data: paginated.data.map((folder) =>
        toProjectFolderResponseDto(folder, countsByFolderId.get(folder.id) ?? 0),
      ),
    } as unknown as Paginated<ProjectFolderResponseDto>;
  }

  @Get('ungrouped-count')
  @ApiOperation({
    summary: 'Get the count of active projects not assigned to any folder',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the count of ungrouped projects.',
    type: UngroupedProjectsCountResponseDto,
  })
  async ungroupedCount(): Promise<UngroupedProjectsCountResponseDto> {
    const { ungroupedCount } =
      await this.projectFolderService.countProjectsByFolder();
    return { count: ungroupedCount };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project folder by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the project folder with the specified ID.',
    type: ProjectFolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project folder not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectFolderResponseDto> {
    const folder = await this.projectFolderService.findOne(id);
    if (!folder) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return toProjectFolderResponseDto(folder);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project folder by ID' })
  @ApiResponse({
    status: 200,
    description: 'The project folder has been successfully updated.',
    type: ProjectFolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project folder not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectFolderDto: UpdateProjectFolderDto,
  ): Promise<ProjectFolderResponseDto> {
    const folder = await this.projectFolderService.update(
      id,
      updateProjectFolderDto,
    );
    if (!folder) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return toProjectFolderResponseDto(folder);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Soft delete a project folder by ID, unassigning it from any projects',
  })
  @ApiResponse({
    status: 200,
    description: 'The project folder has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Project folder not found.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.projectFolderService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return { message: `Project folder with ID ${id} successfully deleted` };
  }
}
