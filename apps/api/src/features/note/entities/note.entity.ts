import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Note extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Content of the note' })
  content: string;

  @Column({ type: 'double precision', nullable: true })
  @ApiProperty({
    description: 'Latitude coordinate of the note',
    required: false,
    nullable: true,
    type: 'number',
  })
  lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  @ApiProperty({
    description: 'Longitude coordinate of the note',
    required: false,
    nullable: true,
    type: 'number',
  })
  lng: number | null;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Plain text tags of the note',
    type: [String],
    required: false,
  })
  tags: string[];
}
