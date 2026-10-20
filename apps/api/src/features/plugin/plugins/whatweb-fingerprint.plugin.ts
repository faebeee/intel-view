import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class WhatWebFingerprintPlugin implements NotePlugin {
  id = 'whatweb-fingerprint';
  label = 'WhatWeb fingerprint';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  execute(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    return `whatweb ${url}`;
  }
}
