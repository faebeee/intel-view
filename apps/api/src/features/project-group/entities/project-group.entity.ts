import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';

@Entity()
export class ProjectGroup extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  @ApiProperty({ description: 'Name of the project group' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Description of the project group',
    required: false,
    nullable: true,
  })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the group (HEX code or name)' })
  color: string;

  @OneToMany(() => Project, (project) => project.group)
  projects: Project[];
}
