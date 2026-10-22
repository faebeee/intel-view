import { Module } from '@nestjs/common';
import { NoteModule } from '../note/note.module';
import { PluginController } from './plugin.controller';
import { PluginRegistryService } from './plugin-registry.service';
import { NOTE_PLUGIN } from './plugin.interface';
import { GobusterDirectoryEnumerationPlugin } from './plugins/gobuster-directory-enumeration/gobuster-directory-enumeration.plugin';
import { WhoisLookupPlugin } from './plugins/whois-lookup/whois-lookup.plugin';
import { ReverseDnsLookupPlugin } from './plugins/reverse-dns-lookup/reverse-dns-lookup.plugin';
import { MasscanFastPortScanPlugin } from './plugins/masscan-fast-port-scan/masscan-fast-port-scan.plugin';
import { NiktoWebScanPlugin } from './plugins/nikto-web-scan/nikto-web-scan.plugin';
import { WhatWebFingerprintPlugin } from './plugins/whatweb-fingerprint/whatweb-fingerprint.plugin';
import { SslScanTlsCheckPlugin } from './plugins/sslscan-tls-check/sslscan-tls-check.plugin';
import { SubdomainEnumSubfinderPlugin } from './plugins/subdomain-enum-subfinder/subdomain-enum-subfinder.plugin';
import { WaybackUrlsPlugin } from './plugins/wayback-urls/wayback-urls.plugin';
import { CurlHeadersSnippetPlugin } from './plugins/curl-headers-snippet/curl-headers-snippet.plugin';
import { ExiftoolMetadataPlugin } from './plugins/exiftool-metadata/exiftool-metadata.plugin';
import { FileTypeStringsPlugin } from './plugins/file-type-strings/file-type-strings.plugin';
import { Sha256HashPlugin } from './plugins/sha256-hash/sha256-hash.plugin';
import { NmapHalfOpenScanPlugin } from './plugins/nmap/nmap-half-open-scan/nmap-half-open-scan.plugin';
import { NmapServiceVersionScanPlugin } from './plugins/nmap/nmap-service-version-scan/nmap-service-version-scan.plugin';
import { NmapUdpScanPlugin } from './plugins/nmap/nmap-udp-scan/nmap-udp-scan.plugin';

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
export class PluginModule { }
