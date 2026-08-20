import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddNoteChildDto {
  @IsInt()
  @ApiProperty({ description: 'ID of the note to add as a child' })
  childId: number;
}
