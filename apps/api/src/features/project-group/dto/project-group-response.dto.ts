import { ApiProperty } from '@nestjs/swagger';
import { ProjectGroup } from '../entities/project-group.entity';

export class ProjectGroupResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  description: string | null;

  @ApiProperty({ description: 'Color of the group (HEX code or name)' })
  color: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toProjectGroupResponseDto(
  group: ProjectGroup,
): ProjectGroupResponseDto {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    color: group.color,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}
