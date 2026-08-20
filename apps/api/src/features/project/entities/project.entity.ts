import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../note/entities/note.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { ProjectGroup } from '../../project-group/entities/project-group.entity';

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

  @Column({ type: 'int', nullable: true })
  @ApiProperty({
    description: 'ID of the group this project belongs to',
    required: false,
    nullable: true,
  })
  groupId: number | null;

  @ManyToOne(() => ProjectGroup, (group) => group.projects, {
    nullable: true,
  })
  @JoinColumn({ name: 'groupId' })
  group: ProjectGroup | null;

  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];

  @OneToMany(() => Tag, (tag) => tag.project)
  tags: Tag[];
}
