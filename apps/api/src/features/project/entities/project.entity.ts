import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../note/entities/note.entity';
import { Tag } from '../../tag/entities/tag.entity';

@Entity()
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  @ApiProperty({ description: 'Name of the project' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Description of the project',
    required: false,
    nullable: true,
  })
  description: string | null;

  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];

  @OneToMany(() => Tag, (tag) => tag.project)
  tags: Tag[];
}
