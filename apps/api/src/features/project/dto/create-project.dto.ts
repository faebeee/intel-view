import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { MAP_STYLES } from '../entities/project.entity';
import type { MapStyle } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the project' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A description of the project',
    required: false,
  })
  description?: string;

  @IsIn(MAP_STYLES)
  @IsOptional()
  @ApiProperty({
    description: 'Preferred map tile style for this project',
    enum: MAP_STYLES,
    required: false,
  })
  mapStyle?: MapStyle;
}
