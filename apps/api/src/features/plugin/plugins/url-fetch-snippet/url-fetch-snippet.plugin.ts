import { Injectable } from '@nestjs/common';
import type { NotePlugin } from '../../plugin.interface';
import type { NoteResponseDto } from '../../../note/dto/note-response.dto';

/**
 * Generates a JavaScript `fetch` snippet for a `'url'`-type note's content,
 * so a user can quickly copy ready-to-use code for calling that URL.
 */
@Injectable()
export class UrlFetchSnippetPlugin implements NotePlugin {
  id = 'url-fetch-snippet';
  label = 'Generate fetch snippet';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  execute(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    return [
      `const response = await fetch(${JSON.stringify(url)});`,
      'if (!response.ok) {',
      '  throw new Error(`Request failed: ${response.status}`);',
      '}',
      'const data = await response.json();',
      'console.log(data);',
    ].join('\n');
  }
}
