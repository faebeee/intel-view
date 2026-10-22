import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class NmapServiceVersionScanPlugin implements NotePlugin {
  id = 'nmap-service-version-scan';
  label = 'Nmap service/version scan';
  noteTypes: NotePlugin['noteTypes'] = ['ip'];

  preview(note: NoteResponseDto): string {
    const ip = note.content?.trim() || '127.0.0.1';
    return `nmap -sV -sC -p- ${ip}`;
  }
}
