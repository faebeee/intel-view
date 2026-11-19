import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveAsTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @IsOptional()
  @ApiProperty({
    description:
      "Name of the new template. Defaults to the source project's name followed by ' (template)'.",
    required: false,
  })
  name?: string;
}
