import { Module } from '@nestjs/common';
import { ProjectGroupModule } from '../project-group/project-group.module';
import { ProjectModule } from '../project/project.module';
import { NoteModule } from '../note/note.module';
import { TagModule } from '../tag/tag.module';
import { ProjectGroupMcpController } from './project-group-mcp.controller';
import { ProjectMcpController } from './project-mcp.controller';
import { NoteMcpController } from './note-mcp.controller';
import { TagMcpController } from './tag-mcp.controller';

/**
 * Exposes the app's core domain services (project groups, projects, notes,
 * tags) as MCP tools for AI agents, via `@rekog/mcp-nest`'s
 * `@McpController()`/`@Tool()` decorators. The actual MCP transport
 * (`McpStrategy`) is configured and mounted in `app.module.ts`/`main.ts`;
 * this module only supplies the tool controllers it dispatches to.
 */
@Module({
  imports: [ProjectGroupModule, ProjectModule, NoteModule, TagModule],
  controllers: [
    ProjectGroupMcpController,
    ProjectMcpController,
    NoteMcpController,
    TagMcpController,
  ],
})
export class McpFeatureModule {}
