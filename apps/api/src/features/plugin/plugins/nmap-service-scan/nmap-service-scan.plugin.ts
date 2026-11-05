import { Injectable } from '@nestjs/common';
import { Note } from 'src/features/note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import type { NotePlugin } from '../../plugin.interface';
import { formatCommand } from '../../plugin.interface';

@Injectable()
export class NmapServiceScanPlugin implements NotePlugin {
  id = 'nmap-service-scan';
  label = 'Nmap Service Scan';
  noteType = 'command';
  noteTypes = ['ip'];
  executable = true;

  constructor(private commandContainer: CommandContainer) {}

  /**
   * The preview returns the display form of the command that will be run.
   * This will be used as the title of the new note.
   *
   * Derived from `getCommand` so the previewed and executed commands cannot
   * drift apart.
   */
  preview(note: Note): string {
    return formatCommand(this.getCommand(note));
  }

  /**
   * Returns the argv array to be executed. The target is kept as a single,
   * separate element so it can never be read as additional nmap flags by the
   * argument splitter — note that this does NOT stop a target that itself
   * begins with `-` from being parsed as a flag by nmap, which is why callers
   * validate the note content as an IP first (see `assertExecutableNote`).
   */
  getCommand(note: Note): string[] {
    return ['nmap', '-sV', '-p-', note.content.trim()];
  }

  /**
   * Executes the nmap command in the tooling container and returns the output.
   */
  execute(argv: string[]): Promise<string> {
    return this.commandContainer.runCommand(argv);
  }
}
