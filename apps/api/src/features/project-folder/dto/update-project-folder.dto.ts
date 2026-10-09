import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProjectFolderDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The name of the project folder',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A description of the project folder',
    required: false,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The color of the folder', required: false })
  color?: string;
}
