import { Injectable } from '@nestjs/common';
import type { Note } from '../../../note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import type { NotePlugin } from '../../plugin.interface';
import { formatCommand } from '../../plugin.interface';

/**
 * WHOIS lookup for an IP note, via `whois` in the tooling container: the
 * owning organisation, network range and registry of the address. Useful
 * for confirming an external target is in scope (and not shared hosting or
 * a CDN). Private/reserved addresses are not special-cased — the registry
 * answers with the IANA reserved-block record, which is accurate.
 */
@Injectable()
export class WhoisLookupPlugin implements NotePlugin {
  id = 'whois-lookup';
  label = 'WHOIS Lookup';
  noteType = 'command';
  noteTypes = ['ip'];
  executable = true;

  constructor(private readonly commandContainer: CommandContainer) {}

  /** Display form of the command; derived from `getCommand` so they can't drift. */
  preview(note: Note): string {
    return formatCommand(this.getCommand(note));
  }

  /**
   * The IP is a single argv element; callers validate it is a real IP first
   * (see `assertExecutableNote`), so it can't be read as a flag.
   */
  getCommand(note: Note): string[] {
    return ['whois', note.content.trim()];
  }

  execute(argv: string[]): Promise<string> {
    return this.commandContainer.runCommand(argv);
  }
}
