import { ApiProperty } from '@nestjs/swagger';
import { PROJECT_COLOR_THEMES, Project } from '../entities/project.entity';
import type { ProjectColorTheme } from '../entities/project.entity';

export class ProjectFolderSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  color: string;
}

export class ProjectResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  description: string | null;

  @ApiProperty({ type: 'number', nullable: true, required: false })
  folderId: number | null;

  @ApiProperty({
    type: ProjectFolderSummaryDto,
    nullable: true,
    required: false,
  })
  folder: ProjectFolderSummaryDto | null;

  @ApiProperty({
    description:
      'The accent color palette applied app-wide while this project is open.',
    enum: PROJECT_COLOR_THEMES,
  })
  color: ProjectColorTheme;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toProjectResponseDto(project: Project): ProjectResponseDto {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    folderId: project.folderId,
    folder: project.folder
      ? {
          id: project.folder.id,
          name: project.folder.name,
          color: project.folder.color,
        }
      : null,
    color: project.color,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
