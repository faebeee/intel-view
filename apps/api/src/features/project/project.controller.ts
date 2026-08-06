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
import { ProjectService, projectPaginateConfig } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  ProjectResponseDto,
  toProjectResponseDto,
} from './dto/project-response.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
    type: ProjectResponseDto,
  })
  async create(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.create(createProjectDto);
    return toProjectResponseDto(project);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all active projects with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(projectPaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active projects paginated.',
  })
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ProjectResponseDto>> {
    const paginated = await this.projectService.findAll(query);
    return {
      ...paginated,
      data: paginated.data.map(toProjectResponseDto),
    } as unknown as Paginated<ProjectResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the project with the specified ID.',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return toProjectResponseDto(project);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project by ID' })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully updated.',
    type: ProjectResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectService.update(id, updateProjectDto);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return toProjectResponseDto(project);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete a project by ID, cascading to its notes and tags',
  })
  @ApiResponse({
    status: 200,
    description: 'The project has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.projectService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return { message: `Project with ID ${id} successfully deleted` };
  }
}
