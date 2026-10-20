import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class NiktoWebScanPlugin implements NotePlugin {
  id = 'nikto-web-scan';
  label = 'Nikto web scan';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  preview(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    return `nikto -h ${url}`;
  }
}
