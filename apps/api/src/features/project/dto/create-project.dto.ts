import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PROJECT_MAP_THEMES } from '../entities/project.entity';
import type { ProjectMapTheme } from '../entities/project.entity';

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
    description: 'ID of the group this project belongs to',
    type: 'number',
    required: false,
    nullable: true,
  })
  groupId?: number | null;

  @IsIn(PROJECT_MAP_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      "The selected base map tile style for this project's map view. Defaults to 'street'.",
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
      'Optional project tags to create alongside the project. Existing tags are normalized and stored on the project.',
    type: [String],
    required: false,
  })
  tags?: string[];
}
