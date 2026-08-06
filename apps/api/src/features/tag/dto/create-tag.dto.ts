import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the tag' })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The color of the tag (e.g. HEX value like #FF0000)',
  })
  color: string;
}
