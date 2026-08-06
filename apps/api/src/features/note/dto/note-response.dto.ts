import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../entities/note.entity';

export class NoteResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty({ description: 'Content of the note' })
  content: string;

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

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toNoteResponseDto(note: Note): NoteResponseDto {
  return {
    id: note.id,
    projectId: note.projectId,
    content: note.content,
    lat: note.lat,
    lng: note.lng,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
