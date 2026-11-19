import { Injectable } from '@nestjs/common';
import type { Note } from '../../../note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import type { NotePlugin } from '../../plugin.interface';
import { formatCommand } from '../../plugin.interface';

/**
 * Reverse DNS (PTR) lookup for an IP note, via `dig -x` in the tooling
 * container. `dig` is used rather than `host` because it exits 0 on
 * NXDOMAIN, so a missing PTR record is still reported as readable output
 * (the `status:` header line) instead of a bare failure.
 */
@Injectable()
export class ReverseDnsLookupPlugin implements NotePlugin {
  id = 'reverse-dns-lookup';
  label = 'Reverse DNS Lookup';
  noteType = 'command';
  noteTypes = ['ip'];
  executable = true;

  constructor(private readonly commandContainer: CommandContainer) {}

  /** Display form of the command; derived from `getCommand` so they can't drift. */
  preview(note: Note): string {
    return formatCommand(this.getCommand(note));
  }

  /**
   * `+noall +comments +answer` trims dig's output to the response status and
   * the PTR answer. The IP is a single argv element; callers validate it is a
   * real IP first (see `assertExecutableNote`), so it can't be read as a flag.
   */
  getCommand(note: Note): string[] {
    return ['dig', '-x', note.content.trim(), '+noall', '+comments', '+answer'];
  }

  execute(argv: string[]): Promise<string> {
    return this.commandContainer.runCommand(argv);
  }
}
