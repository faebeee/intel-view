import { ApiProperty } from '@nestjs/swagger';
import {
  NoteHistoryEntry,
  NOTE_HISTORY_CHANGE_TYPES,
} from '../entities/note-history-entry.entity';
import type {
  NoteFieldChange,
  NoteHistoryChangeType,
} from '../entities/note-history-entry.entity';

export class NoteHistoryEntryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  noteId: number;

  @ApiProperty({
    description:
      "The kind of event this entry records: 'created' when the note was made, 'updated' for a subsequent edit",
    enum: NOTE_HISTORY_CHANGE_TYPES,
  })
  changeType: NoteHistoryChangeType;

  @ApiProperty({
    description:
      "For 'updated' entries, the list of fields that changed in that edit, each with their previous and new value. Null for 'created' entries.",
    type: [Object],
    required: false,
    nullable: true,
  })
  changes: NoteFieldChange[] | null;

  @ApiProperty()
  createdAt: Date;
}

export function toNoteHistoryEntryResponseDto(
  entry: NoteHistoryEntry,
): NoteHistoryEntryResponseDto {
  return {
    id: entry.id,
    noteId: entry.noteId,
    changeType: entry.changeType,
    changes: entry.changes,
    createdAt: entry.createdAt,
  };
}
