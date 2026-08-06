import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateNoteHistoryEntryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Markdown content of the manual history entry',
  })
  content: string;
}
