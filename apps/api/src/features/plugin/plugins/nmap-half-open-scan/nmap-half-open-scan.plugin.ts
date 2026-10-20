import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class NmapHalfOpenScanPlugin implements NotePlugin {
  id = 'nmap-half-open-scan';
  label = 'Nmap Half open scan';
  noteTypes: NotePlugin['noteTypes'] = ['ip'];

  preview(note: NoteResponseDto): string {
    const ip = note.content?.trim() || '127.0.0.1';
    return `sudo nmap -sA ${ip}`;
  }
}
