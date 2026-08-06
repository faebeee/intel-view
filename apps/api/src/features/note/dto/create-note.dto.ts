import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  IsObject,
  IsInt,
} from 'class-validator';
import { NOTE_TYPES } from '../entities/note.entity';
import type { NoteType } from '../entities/note.entity';

export class CreateNoteDto {
  @IsIn(NOTE_TYPES)
  @IsOptional()
  @ApiProperty({
    description: 'The type of note, determines how it is rendered',
    enum: NOTE_TYPES,
    required: false,
    default: 'markdown',
  })
  type?: NoteType;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The content of the note', required: false })
  content?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description:
      'Type-specific configuration object for the note (used by non-markdown note types)',
    type: Object,
    required: false,
    nullable: true,
  })
  config?: Record<string, unknown> | null;

  @IsOptional()
  @ApiProperty({
    description: 'The latitude coordinate of the note',
    required: false,
    type: Number,
    nullable: true,
  })
  lat?: number | null;

  @IsOptional()
  @ApiProperty({
    description: 'The longitude coordinate of the note',
    required: false,
    type: Number,
    nullable: true,
  })
  lng?: number | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ApiProperty({
    description: 'Optional list of plain text tags associated with this note',
    required: false,
    type: [String],
  })
  tags?: string[];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description:
      'ID of the parent note this note should be nested under. Omit or set to null for a top-level (root) note.',
    required: false,
    type: Number,
    nullable: true,
  })
  parentId?: number | null;
}
