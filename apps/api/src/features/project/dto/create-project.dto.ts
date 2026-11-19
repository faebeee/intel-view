import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  PROJECT_COLOR_THEMES,
  PROJECT_STATUSES,
} from '../entities/project.entity';
import type {
  ProjectColorTheme,
  ProjectStatus,
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

  @IsIn(PROJECT_COLOR_THEMES)
  @IsOptional()
  @ApiProperty({
    description:
      "The accent color palette applied app-wide while this project is open. Defaults to 'ocean'.",
    enum: PROJECT_COLOR_THEMES,
    required: false,
  })
  color?: ProjectColorTheme;

  @IsIn(PROJECT_STATUSES)
  @IsOptional()
  @ApiProperty({
    description: "Lifecycle status of the project. Defaults to 'planned'.",
    enum: PROJECT_STATUSES,
    required: false,
  })
  status?: ProjectStatus;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    description:
      'Create the project as a template (hidden from regular listings, used as a note source for new projects). Defaults to false.',
    required: false,
    default: false,
  })
  isTemplate?: boolean;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description:
      "ID of a template project whose notes (including their parent/child links and canvas positions) are copied into the new project. When `color` is omitted, the template's color is used.",
    type: 'number',
    required: false,
  })
  templateId?: number;
}
