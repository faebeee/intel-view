import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectGroupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the project group' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A description of the project group',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The color of the group (e.g. HEX value like #FF0000)',
  })
  color: string;
}
