import { ApiProperty } from '@nestjs/swagger';
import { ProjectFolder } from '../entities/project-folder.entity';

export class ProjectFolderResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  description: string | null;

  @ApiProperty({ description: 'Color of the folder (HEX code or name)' })
  color: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of active projects currently assigned to this folder',
  })
  projectsCount: number;
}

export function toProjectFolderResponseDto(
  folder: ProjectFolder,
  projectsCount = 0,
): ProjectFolderResponseDto {
  return {
    id: folder.id,
    name: folder.name,
    description: folder.description,
    color: folder.color,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
    projectsCount,
  };
}

export class UngroupedProjectsCountResponseDto {
  @ApiProperty({
    description: 'Number of active projects not assigned to any folder',
  })
  count: number;
}
