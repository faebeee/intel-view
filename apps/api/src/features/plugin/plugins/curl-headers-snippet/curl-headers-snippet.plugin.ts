import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class CurlHeadersSnippetPlugin implements NotePlugin {
  id = 'curl-headers-snippet';
  label = 'cURL response headers';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  preview(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    return `curl -sI "${url}"`;
  }
}
