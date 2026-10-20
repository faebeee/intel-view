import { Injectable } from '@nestjs/common';
import { NotePlugin } from '../../plugin.interface';
import { NoteResponseDto } from 'src/features/note/dto/note-response.dto';

@Injectable()
export class WhoisLookupPlugin implements NotePlugin {
  id = 'whois-lookup';
  label = 'Whois lookup';
  noteTypes: NotePlugin['noteTypes'] = ['ip'];

  preview(note: NoteResponseDto): string {
    const ip = note.content?.trim() || '127.0.0.1';
    return `whois ${ip}`;
  }
}
