import { Injectable } from '@nestjs/common';
import { Note } from 'src/features/note/entities/note.entity';
import { CommandContainer } from '../../command-container.service';
import type { NotePlugin } from '../../plugin.interface';

@Injectable()
export class NmapServiceScanPlugin implements NotePlugin {
  id = 'nmap-service-scan';
  label = 'Nmap Service Scan';
  noteTypes = ['ip'];
  executable = false;

  constructor(private commandContainer: CommandContainer) { }

  /**
   * The preview returns the command that will be run.
   * This will be used as the title of the new note.
   */
  preview(note: Note): string {
    return `nmap -sV -p- ${note.content}`;
  }

  /**
   * Returns the shell command to be executed.
   */
  getCommand(note: Note): string {
    return this.preview(note);
  }

  /**
   * Executes the nmap command and returns the output.
   */
  execute(command: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
