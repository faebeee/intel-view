import { ApiProperty } from '@nestjs/swagger';
import { Project, MAP_STYLES } from '../entities/project.entity';
import type { MapStyle } from '../entities/project.entity';

export class ProjectResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  description: string | null;

  @ApiProperty({ enum: MAP_STYLES })
  mapStyle: MapStyle;

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
    mapStyle: project.mapStyle,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
