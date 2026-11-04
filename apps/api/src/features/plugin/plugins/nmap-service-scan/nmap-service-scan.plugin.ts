import { Injectable } from '@nestjs/common';
import type { NotePlugin } from '../../plugin.interface';
import type { NoteResponseDto } from '../../../note/dto/note-response.dto';
import { CommandContainer } from '../../command-container.service';

@Injectable()
export class NmapServiceScanPlugin implements NotePlugin {
  id = 'nmap-service-scan';
  label = 'Nmap Service Scan';
  noteTypes = ['ip'];

  constructor(private commandContainer: CommandContainer) { }

  /**
   * The preview returns the command that will be run.
   * This will be used as the title of the new note.
   */
  preview(note: NoteResponseDto): string {
    return `nmap -sV -p- ${note.content}`;
  }

  /**
   * Returns the shell command to be executed.
   */
  getCommand(note: NoteResponseDto): string {
    return this.preview(note);
  }

  /**
   * Executes the nmap command and returns the output.
   */
  execute(command: string): Promise<string> {
    return Promise.resolve(command);
  }
}
