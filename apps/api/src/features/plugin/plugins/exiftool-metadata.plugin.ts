import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class ExiftoolMetadataPlugin implements NotePlugin {
  id = 'exiftool-metadata';
  label = 'Extract metadata (exiftool)';
  noteTypes: NotePlugin['noteTypes'] = ['file'];

  execute(note: NoteResponseDto): string {
    const fileName = note.fileName?.trim() || 'file.ext';
    return `exiftool "${fileName}"`;
  }
}
