import { ApiProperty } from '@nestjs/swagger';
import { PROJECT_MAP_THEMES, Project } from '../entities/project.entity';
import type { ProjectMapTheme } from '../entities/project.entity';

export class ProjectGroupSummaryDto {
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
  groupId: number | null;

  @ApiProperty({
    type: ProjectGroupSummaryDto,
    nullable: true,
    required: false,
  })
  group: ProjectGroupSummaryDto | null;

  @ApiProperty({
    description:
      "The selected base map tile style for this project's map view.",
    enum: PROJECT_MAP_THEMES,
  })
  mapTheme: ProjectMapTheme;

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
    groupId: project.groupId,
    group: project.group
      ? {
          id: project.group.id,
          name: project.group.name,
          color: project.group.color,
        }
      : null,
    mapTheme: project.mapTheme,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
