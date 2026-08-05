import { ApiProperty } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: 'The content of the note', required: false })
  content: string;

  @ApiProperty({
    description: 'The latitude coordinate of the note',
    required: false,
    type: Number,
    nullable: true,
  })
  lat?: number | null;

  @ApiProperty({
    description: 'The longitude coordinate of the note',
    required: false,
    type: Number,
    nullable: true,
  })
  lng?: number | null;
}
