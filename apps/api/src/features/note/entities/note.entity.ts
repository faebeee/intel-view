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
  })
  lat: number | null;

  @Column({ type: 'double precision', nullable: true })
  @ApiProperty({
    description: 'Longitude coordinate of the note',
    required: false,
    nullable: true,
  })
  lng: number | null;
}
