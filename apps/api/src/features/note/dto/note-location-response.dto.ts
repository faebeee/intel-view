import { ApiProperty } from '@nestjs/swagger';
import { NoteLocation } from '../entities/note-location.entity';

export class NoteLocationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  noteId: number;

  @ApiProperty({
    description:
      "Short human-readable label for the note this location belongs to (its title, a truncated content snippet, or 'Untitled note')",
  })
  noteLabel: string;

  @ApiProperty({
    description: "Plain text tags of the note this location belongs to",
    type: [String],
  })
  tags: string[];

  @ApiProperty({ description: 'Latitude of the pinned location' })
  lat: number;

  @ApiProperty({ description: 'Longitude of the pinned location' })
  lng: number;

  @ApiProperty({
    description: 'Optional human-readable label for the pinned location',
    type: String,
    required: false,
    nullable: true,
  })
  label: string | null;

  @ApiProperty()
  createdAt: Date;
}

export function toNoteLocationResponseDto(
  location: NoteLocation,
  extra: { noteLabel: string; tags: string[] },
): NoteLocationResponseDto {
  return {
    id: location.id,
    noteId: location.noteId,
    noteLabel: extra.noteLabel,
    tags: extra.tags,
    lat: location.lat,
    lng: location.lng,
    label: location.label,
    createdAt: location.createdAt,
  };
}
