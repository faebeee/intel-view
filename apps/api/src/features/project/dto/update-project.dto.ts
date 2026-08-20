import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

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
}
