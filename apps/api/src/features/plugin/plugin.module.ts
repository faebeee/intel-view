import { Module } from '@nestjs/common';
import { NoteModule } from '../note/note.module';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';
import type { NotePlugin } from './plugin.interface';
import { NmapServiceScanPlugin } from './plugins/nmap-service-scan/nmap-service-scan.plugin';
import { ReverseDnsLookupPlugin } from './plugins/reverse-dns-lookup/reverse-dns-lookup.plugin';
import { WhoisLookupPlugin } from './plugins/whois-lookup/whois-lookup.plugin';
import { CommandContainer } from './command-container.service';

/**
 * Registers all `NotePlugin` implementations as a multi-provider under the
 * `NOTE_PLUGIN` token. To add a new plugin, implement `NotePlugin` under
 * `./plugins/` and add it to the `providers` entry below.
 */
@Module({
  imports: [NoteModule],
  controllers: [PluginController],
  providers: [
    CommandContainer,
    PluginRegistryService,
    NmapServiceScanPlugin,
    ReverseDnsLookupPlugin,
    WhoisLookupPlugin,
    {
      provide: NOTE_PLUGIN,
      useFactory: (
        nmapPlugin: NmapServiceScanPlugin,
        reverseDnsPlugin: ReverseDnsLookupPlugin,
        whoisPlugin: WhoisLookupPlugin,
      ): NotePlugin[] => [nmapPlugin, reverseDnsPlugin, whoisPlugin],
      inject: [
        NmapServiceScanPlugin,
        ReverseDnsLookupPlugin,
        WhoisLookupPlugin,
      ],
    },
  ],
})
export class PluginModule {}
