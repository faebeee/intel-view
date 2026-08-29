import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import {
  PROJECT_COLOR_THEMES,
  PROJECT_MAP_THEMES,
} from '../entities/project.entity';
import type {
  ProjectColorTheme,
  ProjectMapTheme,
} from '../entities/project.entity';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The name of the project', required: false })
  name?: string;

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
    description:
      'ID of the group this project belongs to. Pass null to unassign.',
    type: 'number',
    required: false,
    nullable: true,
  })
  groupId?: number | null;

  @IsIn(PROJECT_MAP_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      "The selected base map tile style for this project's map view.",
    enum: PROJECT_MAP_THEMES,
    required: false,
  })
  mapTheme?: ProjectMapTheme;

  @IsIn(PROJECT_COLOR_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      'The accent color palette applied app-wide while this project is open.',
    enum: PROJECT_COLOR_THEMES,
    required: false,
  })
  color?: ProjectColorTheme;
}
