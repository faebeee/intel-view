import { McpController, Tool } from '@rekog/mcp-nest';
import { Payload } from '@nestjs/microservices';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { TagService } from '../tag/tag.service';
import { toTagResponseDto } from '../tag/dto/tag-response.dto';
import { buildMcpPaginateQuery } from './mcp-paginate.util';
import { textResult, McpToolTextResult } from './mcp-tool-result.util';

const createTagParams = z.object({
  name: z.string().min(1).describe('The name of the tag'),
  color: z
    .string()
    .min(1)
    .describe('The color of the tag (e.g. HEX value like #FF0000)'),
});

const updateTagParams = z.object({
  id: z.number().int().describe('ID of the tag to update'),
  name: z.string().optional().describe('The name of the tag'),
  color: z.string().optional().describe('The color of the tag'),
});

const listTagsParams = z.object({
  page: z.number().int().optional().describe('Page number, 1-indexed'),
  limit: z.number().int().optional().describe('Number of items per page'),
  search: z.string().optional().describe('Free text search across name'),
});

const tagIdParams = z.object({
  id: z.number().int().describe('ID of the tag'),
});

/**
 * Exposes tag CRUD operations as MCP tools for AI agents, mirroring
 * `TagController`'s REST surface.
 */
@McpController()
export class TagMcpController {
  constructor(private readonly tagService: TagService) {}

  @Tool({
    name: 'create_tag',
    description: 'Create a new tag',
    parameters: createTagParams,
  })
  async createTag(
    @Payload() params: z.infer<typeof createTagParams>,
  ): Promise<McpToolTextResult> {
    const tag = await this.tagService.create(params);
    return textResult(toTagResponseDto(tag));
  }

  @Tool({
    name: 'list_tags',
    description: 'List tags with pagination and optional search',
    parameters: listTagsParams,
  })
  async listTags(
    @Payload() params: z.infer<typeof listTagsParams>,
  ): Promise<McpToolTextResult> {
    const paginated = await this.tagService.findAll(
      buildMcpPaginateQuery(params),
    );
    return textResult({
      ...paginated,
      data: paginated.data.map(toTagResponseDto),
    });
  }

  @Tool({
    name: 'get_tag',
    description: 'Get a single tag by ID',
    parameters: tagIdParams,
  })
  async getTag(
    @Payload() { id }: z.infer<typeof tagIdParams>,
  ): Promise<McpToolTextResult> {
    const tag = await this.tagService.findOne(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return textResult(toTagResponseDto(tag));
  }

  @Tool({
    name: 'update_tag',
    description: 'Update a tag by ID',
    parameters: updateTagParams,
  })
  async updateTag(
    @Payload() { id, ...update }: z.infer<typeof updateTagParams>,
  ): Promise<McpToolTextResult> {
    const tag = await this.tagService.update(id, update);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return textResult(toTagResponseDto(tag));
  }

  @Tool({
    name: 'delete_tag',
    description: 'Delete a tag by ID',
    parameters: tagIdParams,
  })
  async deleteTag(
    @Payload() { id }: z.infer<typeof tagIdParams>,
  ): Promise<McpToolTextResult> {
    const deleted = await this.tagService.remove(id);
    if (!deleted) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return textResult({ message: `Tag with ID ${id} successfully deleted` });
  }
}
