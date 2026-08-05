import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The name of the tag', required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The color of the tag', required: false })
  color?: string;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  @ApiProperty({
    description: 'List of Note IDs to associate with this tag',
    required: false,
    type: [Number],
  })
  noteIds?: number[];
}
