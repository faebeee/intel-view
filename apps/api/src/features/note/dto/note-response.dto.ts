import { ApiProperty } from '@nestjs/swagger';
import {
  Note,
  NOTE_TYPES,
  NOTE_GEOCODE_STATUSES,
} from '../entities/note.entity';
import type { NoteType, NoteGeocodeStatus } from '../entities/note.entity';

export class NoteResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty({
    description:
      "The kind of note: 'standard' (freely-editable rich text), 'log' (append-only timestamped entries), 'address' (content is a physical address, automatically resolved to coordinates), 'file' (holds a single uploaded file stored in object storage), 'url' (content is a single well-formed URL), or 'ip' (content is a single well-formed IPv4 or IPv6 address)",
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
      'Optional custom hex color for this note, overriding the color derived from its first tag. Null if unset.',
    required: false,
    nullable: true,
    type: 'string',
  })
  color: string | null;

  @ApiProperty({
    description: 'IDs of the parent notes this note is nested under, if any.',
    type: [Number],
  })
  parentIds: number[];

  @ApiProperty({
    description: 'IDs of the child notes nested under this note, if any.',
    type: [Number],
  })
  childIds: number[];

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

  @ApiProperty({
    description:
      "Latitude resolved from this note's content (only set for 'address'-type notes with a successfully geocoded address).",
    required: false,
    nullable: true,
    type: 'number',
  })
  latitude: number | null;

  @ApiProperty({
    description:
      "Longitude resolved from this note's content (only set for 'address'-type notes with a successfully geocoded address).",
    required: false,
    nullable: true,
    type: 'number',
  })
  longitude: number | null;

  @ApiProperty({
    description:
      "Outcome of the most recent attempt to geocode this note's content (only applicable to 'address'-type notes). Null until a save has been attempted.",
    enum: NOTE_GEOCODE_STATUSES,
    required: false,
    nullable: true,
  })
  geocodeStatus: NoteGeocodeStatus | null;

  @ApiProperty({
    description:
      'Human-readable place name returned by the geocoding provider for this address note, if resolution succeeded.',
    required: false,
    nullable: true,
  })
  geocodedLabel: string | null;

  @ApiProperty({
    description:
      'Explanation of why geocoding failed for this address note, if resolution did not succeed.',
    required: false,
    nullable: true,
  })
  geocodeError: string | null;

  @ApiProperty({
    description:
      "Original name of the file uploaded to this note (only set for 'file'-type notes that have a file).",
    required: false,
    nullable: true,
    type: 'string',
  })
  fileName: string | null;

  @ApiProperty({
    description: 'MIME type of the file uploaded to this note.',
    required: false,
    nullable: true,
    type: 'string',
  })
  fileMimeType: string | null;

  @ApiProperty({
    description: 'Size in bytes of the file uploaded to this note.',
    required: false,
    nullable: true,
    type: 'number',
  })
  fileSize: number | null;

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
    color: note.color,
    parentIds: note.parentIds ?? [],
    childIds: note.childIds ?? [],
    canvasX: note.canvasX,
    canvasY: note.canvasY,
    latitude: note.latitude,
    longitude: note.longitude,
    geocodeStatus: note.geocodeStatus,
    geocodedLabel: note.geocodedLabel,
    geocodeError: note.geocodeError,
    fileName: note.fileName,
    fileMimeType: note.fileMimeType,
    fileSize: note.fileSize,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}
