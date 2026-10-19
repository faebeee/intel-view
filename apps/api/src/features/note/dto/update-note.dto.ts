import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateNoteDto {
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
      "The markdown content of the note. For 'url'-type notes, must be a single well-formed http(s):// URL.",
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
      "Optional custom hex color (e.g. '#00f2ff') for this note. When unset, falls back to the color of its first tag, if any. Pass `null` to clear a previously set color.",
    required: false,
    nullable: true,
    type: 'string',
  })
  color?: string | null;

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
