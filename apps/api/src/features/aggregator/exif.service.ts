import { Injectable } from '@nestjs/common';
import { NoteService } from '../note/note.service';
import { VirtualNoteDto } from './dto/virtual-note.dto';

@Injectable()
export class ExifService {
  constructor(private noteService: NoteService) {}

  async getVirtualNoteForNote(noteId: number): Promise<VirtualNoteDto> {
    const note = new VirtualNoteDto();
    note.parentIds = [noteId];
    note.content = await this.getExifForNote(noteId);
    return note;
  }

  async getExifForNote(noteId: number): Promise<string> {
    // Placeholder for actual EXIF extraction logic
    const note = await this.noteService.findById(noteId);

    return 'No EXIF data found';
  }
}
