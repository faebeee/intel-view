import { ApiProperty } from '@nestjs/swagger';
import { Note, NOTE_TYPES } from '../entities/note.entity';
import type { NoteType } from '../entities/note.entity';

export class NoteResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty({
    description: 'The type of note, determines how it is rendered',
    enum: NOTE_TYPES,
  })
  type: NoteType;

  @ApiProperty({ description: 'Content of the note' })
  content: string;

  @ApiProperty({
    description:
      'Type-specific configuration object for the note (used by non-markdown note types)',
    type: Object,
    required: false,
    nullable: true,
  })
  config: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Latitude coordinate of the note',
    required: false,
    nullable: true,
    type: 'number',
  })
  lat: number | null;

  @ApiProperty({
    description: 'Longitude coordinate of the note',
    required: false,
    nullable: true,
    type: 'number',
  })
  lng: number | null;

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
    content: note.content,
    config: note.config,
    lat: note.lat,
    lng: note.lng,
    tags: note.tags,
    parentId: note.parentId,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
