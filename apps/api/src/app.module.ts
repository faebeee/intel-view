import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  McpStrategy,
  MCP_STRATEGY,
  StreamableHttpTransport,
} from '@rekog/mcp-nest';
import { NoteModule } from './features/note/note.module';
import { TagModule } from './features/tag/tag.module';
import { ProjectModule } from './features/project/project.module';
import { ProjectFolderModule } from './features/project-folder/project-folder.module';
import { DatabaseModule } from './features/database/database.module';
import { buildTypeOrmOptions } from './features/database/typeorm.config';
import { HealthModule } from './features/health/health.module';
import { McpFeatureModule } from './features/mcp/mcp.module';
import { PluginModule } from './features/plugin/plugin.module';

/**
 * MCP transport strategy exposing the tools defined in `McpFeatureModule`
 * over Streamable HTTP. Mounted in `main.ts` via
 * `app.connectMicroservice({ strategy: mcp })`. Registered as a provider
 * below only so it can be injected if a provider ever needs to perform
 * dynamic tool/resource/prompt registration at runtime.
 */
export const mcp = new McpStrategy({
  name: 'intel-view-mcp',
  version: '1.0.0',
  transports: [new StreamableHttpTransport()],
});

@Module({
  imports: [
    TypeOrmModule.forRoot(buildTypeOrmOptions()),
    DatabaseModule,
    HealthModule,
    ProjectFolderModule,
    ProjectModule,
    NoteModule,
    TagModule,
    McpFeatureModule,
    PluginModule,
  ],
  providers: [{ provide: MCP_STRATEGY, useValue: mcp }],
})
export class AppModule {}
