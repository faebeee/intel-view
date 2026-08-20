import { ApiProperty } from '@nestjs/swagger';
import {
  NoteHistoryEntry,
  NOTE_HISTORY_CHANGE_TYPES,
  NOTE_HISTORY_LINK_DIRECTIONS,
} from '../entities/note-history-entry.entity';
import type {
  NoteFieldChange,
  NoteHistoryChangeType,
  NoteHistoryLinkDirection,
} from '../entities/note-history-entry.entity';

export class NoteHistoryEntryResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  noteId: number;

  @ApiProperty({
    description:
      "The kind of event this entry records: 'created' when the note was made, 'updated' for a subsequent field edit, or 'link_added'/'link_removed' when a parent/child relation was added to or removed from this note",
    enum: NOTE_HISTORY_CHANGE_TYPES,
  })
  changeType: NoteHistoryChangeType;

  @ApiProperty({
    description:
      "For 'updated' entries, the list of fields that changed in that edit, each with their previous and new value. Null for 'created'/'link_added'/'link_removed' entries.",
    type: [Object],
    required: false,
    nullable: true,
  })
  changes: NoteFieldChange[] | null;

  @ApiProperty({
    description:
      "For 'link_added'/'link_removed' entries, the ID of the other note involved in the relation. Null otherwise.",
    required: false,
    nullable: true,
    type: 'number',
  })
  relatedNoteId: number | null;

  @ApiProperty({
    description:
      "For 'link_added'/'link_removed' entries, whether `relatedNoteId` was added/removed as this note's parent or child. Null otherwise.",
    enum: NOTE_HISTORY_LINK_DIRECTIONS,
    required: false,
    nullable: true,
  })
  direction: NoteHistoryLinkDirection | null;

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
    relatedNoteId: entry.relatedNoteId,
    direction: entry.direction,
    createdAt: entry.createdAt,
  };
}
