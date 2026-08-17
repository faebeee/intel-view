import { ApiProperty } from '@nestjs/swagger';
import { Note, NOTE_TYPES } from '../entities/note.entity';
import type { NoteType } from '../entities/note.entity';

export class NoteResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty({
    description:
      "The kind of note: 'standard' (freely-editable rich text) or 'log' (append-only timestamped entries)",
    enum: NOTE_TYPES,
  })
  type: NoteType;

  @ApiProperty({ description: 'Title of the note' })
  title: string;

  @ApiProperty({ description: 'Markdown content of the note' })
  content: string;

  @ApiProperty({
    description: 'Plain text tags of the note',
    type: [String],
    required: false,
  })
  tags: string[];

  @ApiProperty({
    description:
      'ID of the parent note this note is nested under, if any. Null means the note is a top-level (root) note.',
    required: false,
    nullable: true,
    type: 'number',
  })
  parentId: number | null;

  @ApiProperty({
    description:
      'X position of this note on the project canvas view, if it has been placed there.',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasX: number | null;

  @ApiProperty({
    description:
      'Y position of this note on the project canvas view, if it has been placed there.',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasY: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toNoteResponseDto(note: Note): NoteResponseDto {
  return {
    id: note.id,
    projectId: note.projectId,
    type: note.type,
    title: note.title,
    content: note.content,
    tags: note.tags,
    parentId: note.parentId,
    canvasX: note.canvasX,
    canvasY: note.canvasY,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
