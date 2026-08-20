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
  ProjectGroupService,
  projectGroupPaginateConfig,
} from './project-group.service';
import { CreateProjectGroupDto } from './dto/create-project-group.dto';
import { UpdateProjectGroupDto } from './dto/update-project-group.dto';
import {
  ProjectGroupResponseDto,
  toProjectGroupResponseDto,
} from './dto/project-group-response.dto';

@ApiTags('project-groups')
@Controller('project-groups')
export class ProjectGroupController {
  constructor(private readonly projectGroupService: ProjectGroupService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project group' })
  @ApiResponse({
    status: 201,
    description: 'The project group has been successfully created.',
    type: ProjectGroupResponseDto,
  })
  async create(
    @Body() createProjectGroupDto: CreateProjectGroupDto,
  ): Promise<ProjectGroupResponseDto> {
    const group = await this.projectGroupService.create(createProjectGroupDto);
    return toProjectGroupResponseDto(group);
  }

  @Get()
  @ApiOperation({
    summary:
      'Get all active project groups with pagination, filtering and sorting',
  })
  @ApiPaginationQuery(projectGroupPaginateConfig)
  @ApiResponse({
    status: 200,
    description: 'Return all active project groups paginated.',
  })
  async findAll(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ProjectGroupResponseDto>> {
    const paginated = await this.projectGroupService.findAll(query);
    return {
      ...paginated,
      data: paginated.data.map(toProjectGroupResponseDto),
    } as unknown as Paginated<ProjectGroupResponseDto>;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single project group by ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the project group with the specified ID.',
    type: ProjectGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project group not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProjectGroupResponseDto> {
    const group = await this.projectGroupService.findOne(id);
    if (!group) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return toProjectGroupResponseDto(group);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a project group by ID' })
  @ApiResponse({
    status: 200,
    description: 'The project group has been successfully updated.',
    type: ProjectGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Project group not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectGroupDto: UpdateProjectGroupDto,
  ): Promise<ProjectGroupResponseDto> {
    const group = await this.projectGroupService.update(
      id,
      updateProjectGroupDto,
    );
    if (!group) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return toProjectGroupResponseDto(group);
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Soft delete a project group by ID, unassigning it from any projects',
  })
  @ApiResponse({
    status: 200,
    description: 'The project group has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Project group not found.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.projectGroupService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return { message: `Project group with ID ${id} successfully deleted` };
  }
}
