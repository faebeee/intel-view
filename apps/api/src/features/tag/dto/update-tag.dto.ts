import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTagDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The name of the tag', required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The color of the tag', required: false })
  color?: string;
}
