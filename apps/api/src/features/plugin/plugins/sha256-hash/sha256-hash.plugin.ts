import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class Sha256HashPlugin implements NotePlugin {
  id = 'sha256-hash';
  label = 'SHA-256 hash';
  noteTypes: NotePlugin['noteTypes'] = ['file'];

  preview(note: NoteResponseDto): string {
    const fileName = note.fileName?.trim() || 'file.ext';
    return `sha256sum "${fileName}"`;
  }
}
