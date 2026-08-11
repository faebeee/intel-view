import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteLogEntryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Markdown content of the log entry' })
  content: string;
}
