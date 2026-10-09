import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { ProjectService } from '../project/project.service';
import {
  PROJECT_COLOR_THEMES,
  PROJECT_MAP_THEMES,
} from '../project/entities/project.entity';
import type {
  ProjectColorTheme,
  ProjectMapTheme,
} from '../project/entities/project.entity';
import { toProjectResponseDto } from '../project/dto/project-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const mapThemeEnum = z
  .enum(PROJECT_MAP_THEMES as [ProjectMapTheme, ...ProjectMapTheme[]])
  .optional()
  .describe(
    "The selected base map tile style for this project's map view. Defaults to 'street'.",
  );

const colorThemeEnum = z
  .enum(PROJECT_COLOR_THEMES as [ProjectColorTheme, ...ProjectColorTheme[]])
  .optional()
  .describe(
    "The accent color palette applied app-wide while this project is open. Defaults to 'ocean'.",
  );

const createProjectParams = z.object({
  name: z.string().min(1).describe('The name of the project'),
  description: z.string().optional().describe('A description of the project'),
  folderId: z
    .number()
    .int()
    .nullish()
    .describe('ID of the folder this project belongs to'),
  mapTheme: mapThemeEnum,
  color: colorThemeEnum,
});

const updateProjectParams = z.object({
  id: z.number().int().describe('ID of the project to update'),
  name: z.string().optional().describe('The name of the project'),
  description: z.string().optional().describe('A description of the project'),
  folderId: z
    .number()
    .int()
    .nullish()
    .describe(
      'ID of the folder this project belongs to. Pass null to unassign.',
    ),
  mapTheme: mapThemeEnum,
  color: colorThemeEnum,
});

const listProjectsParams = z.object({
  page: z.number().int().optional().describe('Page number, 1-indexed'),
  limit: z.number().int().optional().describe('Number of items per page'),
  search: z
    .string()
    .optional()
    .describe('Free text search across name/description'),
});

const projectIdParams = z.object({
  id: z.number().int().describe('ID of the project'),
});

/**
 * Exposes project CRUD operations as MCP tools for AI agents, mirroring
 * `ProjectController`'s REST surface.
 */
@McpController()
export class ProjectMcpController {
  constructor(private readonly projectService: ProjectService) {}

  @Tool({
    name: 'create_project',
    description: 'Create a new project',
    parameters: createProjectParams,
  })
  async createProject(
    @Payload() params: z.infer<typeof createProjectParams>,
  ): Promise<McpToolTextResult> {
    const project = await this.projectService.create(params);
    return textResult(toProjectResponseDto(project));
  }

  @Tool({
    name: 'list_projects',
    description: 'List projects with pagination and optional search',
    parameters: listProjectsParams,
  })
  async listProjects(
    @Payload() params: z.infer<typeof listProjectsParams>,
  ): Promise<McpToolTextResult> {
    const paginated = await this.projectService.findAll(
      buildMcpPaginateQuery(params),
    );
    return textResult({
      ...paginated,
      data: paginated.data.map(toProjectResponseDto),
    });
  }

  @Tool({
    name: 'get_project',
    description: 'Get a single project by ID',
    parameters: projectIdParams,
  })
  async getProject(
    @Payload() { id }: z.infer<typeof projectIdParams>,
  ): Promise<McpToolTextResult> {
    const project = await this.projectService.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return textResult(toProjectResponseDto(project));
  }

  @Tool({
    name: 'update_project',
    description: 'Update a project by ID',
    parameters: updateProjectParams,
  })
  async updateProject(
    @Payload() { id, ...update }: z.infer<typeof updateProjectParams>,
  ): Promise<McpToolTextResult> {
    const project = await this.projectService.update(id, update);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return textResult(toProjectResponseDto(project));
  }

  @Tool({
    name: 'delete_project',
    description: 'Delete a project by ID',
    parameters: projectIdParams,
  })
  async deleteProject(
    @Payload() { id }: z.infer<typeof projectIdParams>,
  ): Promise<McpToolTextResult> {
    const deleted = await this.projectService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return textResult({
      message: `Project with ID ${id} successfully deleted`,
    });
  }
}
