import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AddNoteParentDto {
  @IsInt()
  @ApiProperty({ description: 'ID of the note to add as a parent' })
  parentId: number;
}
