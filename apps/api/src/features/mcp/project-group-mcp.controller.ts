import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { ProjectGroupService } from '../project-group/project-group.service';
import { toProjectGroupResponseDto } from '../project-group/dto/project-group-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const createProjectGroupParams = z.object({
  name: z.string().min(1).describe('The name of the project group'),
  description: z
    .string()
    .optional()
    .describe('A description of the project group'),
  color: z
    .string()
    .min(1)
    .describe('The color of the group (e.g. HEX value like #FF0000)'),
});

const updateProjectGroupParams = z.object({
  id: z.number().int().describe('ID of the project group to update'),
  name: z.string().optional().describe('The name of the project group'),
  description: z
    .string()
    .optional()
    .describe('A description of the project group'),
  color: z.string().optional().describe('The color of the group'),
});

const listProjectGroupsParams = z.object({
  page: z.number().int().optional().describe('Page number, 1-indexed'),
  limit: z.number().int().optional().describe('Number of items per page'),
  search: z
    .string()
    .optional()
    .describe('Free text search across name/description'),
});

const projectGroupIdParams = z.object({
  id: z.number().int().describe('ID of the project group'),
});

/**
 * Exposes project-group CRUD operations as MCP tools for AI agents,
 * mirroring `ProjectGroupController`'s REST surface.
 */
@McpController()
export class ProjectGroupMcpController {
  constructor(private readonly projectGroupService: ProjectGroupService) {}

  @Tool({
    name: 'create_project_group',
    description: 'Create a new project group',
    parameters: createProjectGroupParams,
  })
  async createProjectGroup(
    @Payload() params: z.infer<typeof createProjectGroupParams>,
  ): Promise<McpToolTextResult> {
    const group = await this.projectGroupService.create(params);
    return textResult(toProjectGroupResponseDto(group));
  }

  @Tool({
    name: 'list_project_groups',
    description: 'List project groups with pagination and optional search',
    parameters: listProjectGroupsParams,
  })
  async listProjectGroups(
    @Payload() params: z.infer<typeof listProjectGroupsParams>,
  ): Promise<McpToolTextResult> {
    const paginated = await this.projectGroupService.findAll(
      buildMcpPaginateQuery(params),
    );
    return textResult({
      ...paginated,
      data: paginated.data.map(toProjectGroupResponseDto),
    });
  }

  @Tool({
    name: 'get_project_group',
    description: 'Get a single project group by ID',
    parameters: projectGroupIdParams,
  })
  async getProjectGroup(
    @Payload() { id }: z.infer<typeof projectGroupIdParams>,
  ): Promise<McpToolTextResult> {
    const group = await this.projectGroupService.findOne(id);
    if (!group) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return textResult(toProjectGroupResponseDto(group));
  }

  @Tool({
    name: 'update_project_group',
    description: 'Update a project group by ID',
    parameters: updateProjectGroupParams,
  })
  async updateProjectGroup(
    @Payload() { id, ...update }: z.infer<typeof updateProjectGroupParams>,
  ): Promise<McpToolTextResult> {
    const group = await this.projectGroupService.update(id, update);
    if (!group) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return textResult(toProjectGroupResponseDto(group));
  }

  @Tool({
    name: 'delete_project_group',
    description: 'Delete a project group by ID',
    parameters: projectGroupIdParams,
  })
  async deleteProjectGroup(
    @Payload() { id }: z.infer<typeof projectGroupIdParams>,
  ): Promise<McpToolTextResult> {
    const deleted = await this.projectGroupService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Project group with ID ${id} not found`);
    }
    return textResult({
      message: `Project group with ID ${id} successfully deleted`,
    });
  }
}
