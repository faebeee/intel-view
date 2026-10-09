import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  PROJECT_COLOR_THEMES,
  PROJECT_MAP_THEMES,
} from '../entities/project.entity';
import type {
  ProjectColorTheme,
  ProjectMapTheme,
} from '../entities/project.entity';

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

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: 'ID of the folder this project belongs to',
    type: 'number',
    required: false,
    nullable: true,
  })
  folderId?: number | null;

  @IsIn(PROJECT_MAP_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      "The selected base map tile style for this project's map view. Defaults to 'street'.",
    enum: PROJECT_MAP_THEMES,
    required: false,
  })
  mapTheme?: ProjectMapTheme;

  @IsIn(PROJECT_COLOR_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      "The accent color palette applied app-wide while this project is open. Defaults to 'ocean'.",
    enum: PROJECT_COLOR_THEMES,
    required: false,
  })
  color?: ProjectColorTheme;
}
