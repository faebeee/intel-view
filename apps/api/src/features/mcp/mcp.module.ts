import { Module } from '@nestjs/common';
import { ProjectFolderModule } from '../project-folder/project-folder.module';
import { ProjectModule } from '../project/project.module';
import { NoteModule } from '../note/note.module';
import { TagModule } from '../tag/tag.module';
import { ProjectFolderMcpController } from './project-folder-mcp.controller';
import { ProjectMcpController } from './project-mcp.controller';
import { NoteMcpController } from './note-mcp.controller';
import { TagMcpController } from './tag-mcp.controller';

/**
 * Exposes the app's core domain services (project folders, projects, notes,
 * tags) as MCP tools for AI agents, via `@rekog/mcp-nest`'s
 * `@McpController()`/`@Tool()` decorators. The actual MCP transport
 * (`McpStrategy`) is configured and mounted in `app.module.ts`/`main.ts`;
 * this module only supplies the tool controllers it dispatches to.
 */
@Module({
  imports: [ProjectFolderModule, ProjectModule, NoteModule, TagModule],
  controllers: [
    ProjectFolderMcpController,
    ProjectMcpController,
    NoteMcpController,
    TagMcpController,
  ],
})
export class McpFeatureModule {}
