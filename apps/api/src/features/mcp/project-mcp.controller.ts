import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { ProjectService } from '../project/project.service';
import {
  PROJECT_COLOR_THEMES,
  PROJECT_STATUSES,
} from '../project/entities/project.entity';
import type {
  ProjectColorTheme,
  ProjectStatus,
} from '../project/entities/project.entity';
import { toProjectResponseDto } from '../project/dto/project-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const colorThemeEnum = z
  .enum(PROJECT_COLOR_THEMES as [ProjectColorTheme, ...ProjectColorTheme[]])
  .optional()
  .describe(
    "The accent color palette applied app-wide while this project is open. Defaults to 'ocean'.",
  );

const statusEnum = z
  .enum(PROJECT_STATUSES as [ProjectStatus, ...ProjectStatus[]])
  .optional()
  .describe(
    "Lifecycle status of the project: 'planned', 'ongoing' or 'completed'. Defaults to 'planned'.",
  );

const createProjectParams = z.object({
  name: z.string().min(1).describe('The name of the project'),
  description: z.string().optional().describe('A description of the project'),
  folderId: z
    .number()
    .int()
    .nullish()
    .describe('ID of the folder this project belongs to'),
  color: colorThemeEnum,
  status: statusEnum,
  isTemplate: z
    .boolean()
    .optional()
    .describe(
      'Create the project as a template (a note source for new projects, hidden from regular listings)',
    ),
  templateId: z
    .number()
    .int()
    .optional()
    .describe(
      'ID of a template whose notes (with links and canvas positions) are copied into the new project; its color is used unless one is given',
    ),
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
  color: colorThemeEnum,
  status: statusEnum,
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
