import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class WaybackUrlsPlugin implements NotePlugin {
  id = 'wayback-urls';
  label = 'Historical URLs (Wayback)';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  execute(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    let host = url;
    try {
      const parsed = new URL(url);
      host = parsed.hostname;
    } catch {
      // fallback to raw content
    }
    return `gau ${host}`;
  }
}
