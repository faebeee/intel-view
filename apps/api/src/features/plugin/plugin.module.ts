import { Module } from '@nestjs/common';
import { NoteModule } from '../note/note.module';
import { PluginController } from './plugin.controller';
import { GlobalPluginController } from './global-plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';

/**
 * Registers all `NotePlugin` implementations as a multi-provider under the
 * `NOTE_PLUGIN` token. To add a new plugin, implement `NotePlugin` under
 * `./plugins/` and add it to the `providers` entry below.
 */
@Module({
  imports: [NoteModule],
  controllers: [PluginController, GlobalPluginController],
  providers: [
    PluginRegistryService,
    {
      provide: NOTE_PLUGIN,
      useValue: [],
    },
  ],
})
export class PluginModule {}
