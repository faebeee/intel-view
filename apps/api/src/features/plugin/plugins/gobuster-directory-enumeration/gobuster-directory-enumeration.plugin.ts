import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class GobusterDirectoryEnumerationPlugin implements NotePlugin {
  id = 'dirbuster-dir-enumeration';
  label = 'Directory enumeration';
  noteTypes: NotePlugin['noteTypes'] = ['url'];

  preview(note: NoteResponseDto): string {
    const url = note.content?.trim() || 'https://example.com';
    return `gobuster dir -u "${url}" -w /usr/share/wordlists/dirb/common.txt`;
  }
}
