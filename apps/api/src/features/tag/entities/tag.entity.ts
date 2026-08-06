import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';

@Entity()
export class Tag extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the project this tag belongs to' })
  projectId: number;

  @ManyToOne(() => Project, (project) => project.tags)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 100 })
  @ApiProperty({ description: 'Name of the tag' })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Color of the tag (HEX code or name)' })
  color: string;
}
