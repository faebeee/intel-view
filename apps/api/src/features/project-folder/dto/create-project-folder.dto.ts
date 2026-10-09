import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateProjectFolderDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the project folder' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'A description of the project folder',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The color of the folder (e.g. HEX value like #FF0000)',
  })
  color: string;
}
