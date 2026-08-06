import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The content of the note', required: false })
  content?: string;

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
}
