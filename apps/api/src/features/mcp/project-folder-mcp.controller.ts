import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { ProjectFolderService } from '../project-folder/project-folder.service';
import { toProjectFolderResponseDto } from '../project-folder/dto/project-folder-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const createProjectFolderParams = z.object({
  name: z.string().min(1).describe('The name of the project folder'),
  description: z
    .string()
    .optional()
    .describe('A description of the project folder'),
  color: z
    .string()
    .min(1)
    .describe('The color of the folder (e.g. HEX value like #FF0000)'),
});

const updateProjectFolderParams = z.object({
  id: z.number().int().describe('ID of the project folder to update'),
  name: z.string().optional().describe('The name of the project folder'),
  description: z
    .string()
    .optional()
    .describe('A description of the project folder'),
  color: z.string().optional().describe('The color of the folder'),
});

const listProjectFolderParams = z.object({
  page: z.number().int().optional().describe('Page number, 1-indexed'),
  limit: z.number().int().optional().describe('Number of items per page'),
  search: z
    .string()
    .optional()
    .describe('Free text search across name/description'),
});

const projectFolderIdParams = z.object({
  id: z.number().int().describe('ID of the project folder'),
});

/**
 * Exposes project-folder CRUD operations as MCP tools for AI agents,
 * mirroring `ProjectFolderController`'s REST surface.
 */
@McpController()
export class ProjectFolderMcpController {
  constructor(private readonly projectFolderService: ProjectFolderService) {}

  @Tool({
    name: 'create_project_folder',
    description: 'Create a new project folder',
    parameters: createProjectFolderParams,
  })
  async createProjectFolder(
    @Payload() params: z.infer<typeof createProjectFolderParams>,
  ): Promise<McpToolTextResult> {
    const folder = await this.projectFolderService.create(params);
    return textResult(toProjectFolderResponseDto(folder));
  }

  @Tool({
    name: 'list_project_folders',
    description: 'List project folders with pagination and optional search',
    parameters: listProjectFolderParams,
  })
  async listProjectFolders(
    @Payload() params: z.infer<typeof listProjectFolderParams>,
  ): Promise<McpToolTextResult> {
    const paginated = await this.projectFolderService.findAll(
      buildMcpPaginateQuery(params),
    );
    return textResult({
      ...paginated,
      data: paginated.data.map(toProjectFolderResponseDto),
    });
  }

  @Tool({
    name: 'get_project_folder',
    description: 'Get a single project folder by ID',
    parameters: projectFolderIdParams,
  })
  async getProjectFolder(
    @Payload() { id }: z.infer<typeof projectFolderIdParams>,
  ): Promise<McpToolTextResult> {
    const folder = await this.projectFolderService.findOne(id);
    if (!folder) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return textResult(toProjectFolderResponseDto(folder));
  }

  @Tool({
    name: 'update_project_folder',
    description: 'Update a project folder by ID',
    parameters: updateProjectFolderParams,
  })
  async updateProjectFolder(
    @Payload() { id, ...update }: z.infer<typeof updateProjectFolderParams>,
  ): Promise<McpToolTextResult> {
    const folder = await this.projectFolderService.update(id, update);
    if (!folder) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return textResult(toProjectFolderResponseDto(folder));
  }

  @Tool({
    name: 'delete_project_folder',
    description: 'Delete a project folder by ID',
    parameters: projectFolderIdParams,
  })
  async deleteProjectFolder(
    @Payload() { id }: z.infer<typeof projectFolderIdParams>,
  ): Promise<McpToolTextResult> {
    const deleted = await this.projectFolderService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project folder with ID ${id} not found`);
    }
    return textResult({
      message: `Project folder with ID ${id} successfully deleted`,
    });
  }
}
