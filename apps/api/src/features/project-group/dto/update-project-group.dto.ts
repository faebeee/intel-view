import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProjectGroupDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The name of the project group',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A description of the project group',
    required: false,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'The color of the group', required: false })
  color?: string;
}
