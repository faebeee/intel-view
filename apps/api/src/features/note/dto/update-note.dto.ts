import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsInt,
} from 'class-validator';

export class UpdateNoteDto {
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

  @IsOptional()
  @ApiProperty({
    description: 'X coordinate of the note on the canvas view',
    required: false,
    type: Number,
    nullable: true,
  })
  canvasX?: number | null;

  @IsOptional()
  @ApiProperty({
    description: 'Y coordinate of the note on the canvas view',
    required: false,
    type: Number,
    nullable: true,
  })
  canvasY?: number | null;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description:
      'ID of the parent note this note should be nested under. Set to null to detach and make this a top-level (root) note.',
    required: false,
    type: Number,
    nullable: true,
  })
  parentId?: number | null;
}
