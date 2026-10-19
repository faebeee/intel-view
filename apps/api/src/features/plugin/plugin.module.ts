import { Module } from '@nestjs/common';
import { NoteModule } from '../note/note.module';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';
import { UrlFetchSnippetPlugin } from './plugins/url-fetch-snippet.plugin';

/**
 * Registers all `NotePlugin` implementations as a multi-provider under the
 * `NOTE_PLUGIN` token. To add a new plugin, implement `NotePlugin` under
 * `./plugins/` and add it to both `providers` entries below.
 */
@Module({
  imports: [NoteModule],
  controllers: [PluginController],
  providers: [
    PluginRegistryService,
    UrlFetchSnippetPlugin,
    {
      provide: NOTE_PLUGIN,
      useFactory: (urlFetchSnippetPlugin: UrlFetchSnippetPlugin) => [
        urlFetchSnippetPlugin,
      ],
      inject: [UrlFetchSnippetPlugin],
    },
  ],
})
export class PluginModule {}
