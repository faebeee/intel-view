import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class NmapUdpScanPlugin implements NotePlugin {
  id = 'nmap-udp-scan';
  label = 'Nmap UDP scan';
  noteTypes: NotePlugin['noteTypes'] = ['ip'];

  execute(note: NoteResponseDto): string {
    const ip = note.content?.trim() || '127.0.0.1';
    return `sudo nmap -sU --top-ports 100 ${ip}`;
  }
}
