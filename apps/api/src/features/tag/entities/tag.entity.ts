import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../note/entities/note.entity';

@Entity()
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @ApiProperty({ description: 'Name of the tag' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the tag (HEX code or name)' })
  color: string;

  @ManyToMany(() => Note, (note) => note.tags)
  @JoinTable({
    name: 'note_tags_tag',
  })
  @ApiProperty({ type: () => [Note], description: 'Notes linked to this tag' })
  notes: Note[];
}
