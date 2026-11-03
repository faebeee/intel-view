import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Matches,
  IsNumber,
} from 'class-validator';
import type { NoteType } from '../entities/note.entity';

const NOTE_TYPE_SLUG_PATTERN = /^[a-z][a-z0-9-]{0,39}$/;

export class CreateNoteDto {
  @Matches(NOTE_TYPE_SLUG_PATTERN, {
    message:
      'type must be a lowercase slug (letters, digits, hyphens; starting with a letter)',
  })
  @IsOptional()
  @ApiProperty({
    description:
      "The kind of note to create. Built-in: 'standard' (freely-editable rich text), 'log' (append-only timestamped entries), 'file' (holds a single uploaded file stored in object storage), 'url' (content must be a single well-formed URL), 'ip' (content must be a single well-formed IPv4 or IPv6 address), or 'email' (content must be a single well-formed email address). Any other lowercase slug (e.g. 'ftp', 'ssh', 'http') creates a custom software/service note — behaves like 'standard' content-wise, but can be targeted by its own plugins. Defaults to 'standard'. Immutable after creation.",
    required: false,
    example: 'standard',
    default: 'standard',
  })
  type?: NoteType;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The title of the note',
    required: false,
  })
  title?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      "The markdown content of the note. For 'url'-type notes, must be a single well-formed http(s):// URL. For 'ip'-type notes, must be a single well-formed IPv4 or IPv6 address.",
    required: false,
  })
  content?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Optional list of plain text tags associated with this note',
    required: false,
    type: [String],
  })
  tags?: string[];

  @IsString()
  @IsOptional()
  @ApiProperty({
    description:
      "Optional custom hex color (e.g. '#00f2ff') for this note. When unset, falls back to the color of its first tag, if any.",
    required: false,
    nullable: true,
    type: 'string',
  })
  color?: string | null;

  @IsInt({ each: true })
  @IsArray()
  @IsOptional()
  @ApiProperty({
    description:
      'IDs of the parent notes this note should be nested under, if any. Omit or leave empty for a top-level (root) note.',
    required: false,
    type: [Number],
  })
  parentIds?: number[];

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'X position to place this note at on the project canvas view.',
    required: false,
    type: Number,
    nullable: true,
  })
  canvasX?: number | null;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Y position to place this note at on the project canvas view.',
    required: false,
    type: Number,
    nullable: true,
  })
  canvasY?: number | null;
}
