import { Module } from '@nestjs/common';
import { NoteModule } from '../note/note.module';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';
import { UrlFetchSnippetPlugin } from './plugins/url-fetch-snippet.plugin';
import { GobusterDirectoryEnumerationPlugin } from './plugins/gobuster-directory-enumeration.plugin';
import { NmapHalfOpenScanPlugin } from './plugins/nmap-half-open-scan.plugin';
import { NmapServiceVersionScanPlugin } from './plugins/nmap-service-version-scan.plugin';
import { NmapUdpScanPlugin } from './plugins/nmap-udp-scan.plugin';
import { WhoisLookupPlugin } from './plugins/whois-lookup.plugin';
import { ReverseDnsLookupPlugin } from './plugins/reverse-dns-lookup.plugin';
import { MasscanFastPortScanPlugin } from './plugins/masscan-fast-port-scan.plugin';
import { NiktoWebScanPlugin } from './plugins/nikto-web-scan.plugin';
import { WhatWebFingerprintPlugin } from './plugins/whatweb-fingerprint.plugin';
import { SslScanTlsCheckPlugin } from './plugins/sslscan-tls-check.plugin';
import { SubdomainEnumSubfinderPlugin } from './plugins/subdomain-enum-subfinder.plugin';
import { WaybackUrlsPlugin } from './plugins/wayback-urls.plugin';
import { CurlHeadersSnippetPlugin } from './plugins/curl-headers-snippet.plugin';
import { ExiftoolMetadataPlugin } from './plugins/exiftool-metadata.plugin';
import { FileTypeStringsPlugin } from './plugins/file-type-strings.plugin';
import { Sha256HashPlugin } from './plugins/sha256-hash.plugin';

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
    GobusterDirectoryEnumerationPlugin,
    NmapHalfOpenScanPlugin,
    NmapServiceVersionScanPlugin,
    NmapUdpScanPlugin,
    WhoisLookupPlugin,
    ReverseDnsLookupPlugin,
    MasscanFastPortScanPlugin,
    NiktoWebScanPlugin,
    WhatWebFingerprintPlugin,
    SslScanTlsCheckPlugin,
    SubdomainEnumSubfinderPlugin,
    WaybackUrlsPlugin,
    CurlHeadersSnippetPlugin,
    ExiftoolMetadataPlugin,
    FileTypeStringsPlugin,
    Sha256HashPlugin,
    {
      provide: NOTE_PLUGIN,
      useFactory: (
        urlFetchSnippetPlugin: UrlFetchSnippetPlugin,
        gobusterDirectoryEnumerationPlugin: GobusterDirectoryEnumerationPlugin,
        nmapHalfOpenScanPlugin: NmapHalfOpenScanPlugin,
        nmapServiceVersionScanPlugin: NmapServiceVersionScanPlugin,
        nmapUdpScanPlugin: NmapUdpScanPlugin,
        whoisLookupPlugin: WhoisLookupPlugin,
        reverseDnsLookupPlugin: ReverseDnsLookupPlugin,
        masscanFastPortScanPlugin: MasscanFastPortScanPlugin,
        niktoWebScanPlugin: NiktoWebScanPlugin,
        whatWebFingerprintPlugin: WhatWebFingerprintPlugin,
        sslScanTlsCheckPlugin: SslScanTlsCheckPlugin,
        subdomainEnumSubfinderPlugin: SubdomainEnumSubfinderPlugin,
        waybackUrlsPlugin: WaybackUrlsPlugin,
        curlHeadersSnippetPlugin: CurlHeadersSnippetPlugin,
        exiftoolMetadataPlugin: ExiftoolMetadataPlugin,
        fileTypeStringsPlugin: FileTypeStringsPlugin,
        sha256HashPlugin: Sha256HashPlugin,
      ) => [
        urlFetchSnippetPlugin,
        gobusterDirectoryEnumerationPlugin,
        nmapHalfOpenScanPlugin,
        nmapServiceVersionScanPlugin,
        nmapUdpScanPlugin,
        whoisLookupPlugin,
        reverseDnsLookupPlugin,
        masscanFastPortScanPlugin,
        niktoWebScanPlugin,
        whatWebFingerprintPlugin,
        sslScanTlsCheckPlugin,
        subdomainEnumSubfinderPlugin,
        waybackUrlsPlugin,
        curlHeadersSnippetPlugin,
        exiftoolMetadataPlugin,
        fileTypeStringsPlugin,
        sha256HashPlugin,
      ],
      inject: [
        UrlFetchSnippetPlugin,
        GobusterDirectoryEnumerationPlugin,
        NmapHalfOpenScanPlugin,
        NmapServiceVersionScanPlugin,
        NmapUdpScanPlugin,
        WhoisLookupPlugin,
        ReverseDnsLookupPlugin,
        MasscanFastPortScanPlugin,
        NiktoWebScanPlugin,
        WhatWebFingerprintPlugin,
        SslScanTlsCheckPlugin,
        SubdomainEnumSubfinderPlugin,
        WaybackUrlsPlugin,
        CurlHeadersSnippetPlugin,
        ExiftoolMetadataPlugin,
        FileTypeStringsPlugin,
        Sha256HashPlugin,
      ],
    },
  ],
})
export class PluginModule {}
