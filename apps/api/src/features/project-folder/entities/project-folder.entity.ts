import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';

@Entity()
export class ProjectFolder extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  @ApiProperty({ description: 'Name of the project folder' })
  name: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Description of the project folder',
    required: false,
    nullable: true,
  })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the folder (HEX code or name)' })
  color: string;

  @OneToMany(() => Project, (project) => project.folder)
  projects: Project[];
}
