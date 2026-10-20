import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class SslScanTlsCheckPlugin implements NotePlugin {
  id = 'sslscan-tls-check';
  label = 'SSL/TLS scan';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  preview(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    let host = url;
    try {
      const parsed = new URL(url);
      host = parsed.hostname;
    } catch {
      // fallback to raw content if not a valid URL
    }
    return `sslscan ${host}`;
  }
}
