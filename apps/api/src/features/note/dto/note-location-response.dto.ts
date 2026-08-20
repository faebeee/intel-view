import { ApiProperty } from '@nestjs/swagger';

/**
 * The minimal shape needed to render a pin: either a real `NoteLocation`
 * row (derived from `[[geo:...]]` content tokens) or a synthetic pin
 * derived from a resolved `'address'`-type note's coordinates (see
 * `NoteService.buildAddressPin`) — both are mapped through the same DTO.
 */
type NoteLocationLike = {
  id: number;
  noteId: number;
  lat: number;
  lng: number;
  label: string | null;
  createdAt: Date;
};

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
    description: 'Plain text tags of the note this location belongs to',
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
  location: NoteLocationLike,
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
