import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../entities/tag.entity';

export class TagResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: 'Name of the tag' })
  name: string;

  @ApiProperty({ description: 'Color of the tag (HEX code or name)' })
  color: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export function toTagResponseDto(tag: Tag): TagResponseDto {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}
