import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsInt } from 'class-validator';

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
    description: 'The markdown content of the note',
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
