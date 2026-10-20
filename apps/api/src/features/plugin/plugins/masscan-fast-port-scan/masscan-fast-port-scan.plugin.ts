import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class MasscanFastPortScanPlugin implements NotePlugin {
  id = 'masscan-fast-port-scan';
  label = 'Masscan fast port scan';
  noteTypes: NotePlugin['noteTypes'] = ['ip'];

  preview(note: NoteResponseDto): string {
    const ip = note.content?.trim() || '127.0.0.1';
    return `sudo masscan -p1-65535 ${ip} --rate=1000`;
  }
}
