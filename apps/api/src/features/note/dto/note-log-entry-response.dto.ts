import { ApiProperty } from '@nestjs/swagger';
import { NoteLogEntry } from '../entities/note-log-entry.entity';

export class NoteLogEntryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  noteId: number;

  @ApiProperty({ description: 'Markdown content of this log entry' })
  content: string;

  @ApiProperty()
  createdAt: Date;
}

export function toNoteLogEntryResponseDto(
  entry: NoteLogEntry,
): NoteLogEntryResponseDto {
  return {
    id: entry.id,
    noteId: entry.noteId,
    content: entry.content,
    createdAt: entry.createdAt,
  };
}
