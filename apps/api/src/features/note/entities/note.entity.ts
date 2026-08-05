import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, ManyToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '../../tag/entities/tag.entity';

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

  @ManyToMany(() => Tag, (tag) => tag.notes)
  @ApiProperty({ type: () => [Tag], description: 'Tags linked to this note' })
  tags: Tag[];
}
