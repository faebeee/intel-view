import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class FileTypeStringsPlugin implements NotePlugin {
  id = 'file-type-strings';
  label = 'File type & strings';
  noteTypes: NotePlugin['noteTypes'] = ['file'];

  preview(note: NoteResponseDto): string {
    const fileName = note.fileName?.trim() || 'file.ext';
    return `file "${fileName}" && strings "${fileName}" | less`;
  }
}
