import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { PROJECT_MAP_THEMES } from '../entities/project.entity';
import type { ProjectMapTheme } from '../entities/project.entity';

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

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  @IsOptional()
  @ApiProperty({
    description:
      'Project tags to replace the current tag set with. Pass an empty array to clear all tags.',
    type: [String],
    required: false,
  })
  tags?: string[];
}
