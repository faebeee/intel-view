import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../note/entities/note.entity';
import { ProjectFolder } from '../../project-folder/entities/project-folder.entity';

/**
 * The accent color palette applied app-wide (via the `data-theme` attribute
 * on <html>, see the frontend's `apps/web/src/styles.css`) whenever this
 * project is open. Replaces the old global, user-level color theme picker so
 * each project can have its own visual identity.
 */
export type ProjectColorTheme =
  'ocean' | 'emerald' | 'violet' | 'monochrome' | 'crimson' | 'amber';
export const PROJECT_COLOR_THEMES: ProjectColorTheme[] = [
  'ocean',
  'emerald',
  'violet',
  'monochrome',
  'crimson',
  'amber',
];
export const DEFAULT_PROJECT_COLOR_THEME: ProjectColorTheme = 'ocean';

/**
 * Lifecycle status of a project: not yet started, in progress, or done.
 */
export type ProjectStatus = 'planned' | 'ongoing' | 'completed';
export const PROJECT_STATUSES: ProjectStatus[] = [
  'planned',
  'ongoing',
  'completed',
];
export const DEFAULT_PROJECT_STATUS: ProjectStatus = 'planned';

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
    description: 'ID of the folder this project belongs to',
    required: false,
    nullable: true,
  })
  folderId: number | null;

  @ManyToOne(() => ProjectFolder, (folder) => folder.projects, {
    nullable: true,
  })
  @JoinColumn({ name: 'folderId' })
  folder: ProjectFolder | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: DEFAULT_PROJECT_COLOR_THEME,
  })
  @ApiProperty({
    description:
      'The accent color palette applied app-wide while this project is open.',
    enum: PROJECT_COLOR_THEMES,
    default: DEFAULT_PROJECT_COLOR_THEME,
  })
  color: ProjectColorTheme;

  @Column({ type: 'varchar', length: 20, default: DEFAULT_PROJECT_STATUS })
  @ApiProperty({
    description: 'Lifecycle status of the project.',
    enum: PROJECT_STATUSES,
    default: DEFAULT_PROJECT_STATUS,
  })
  status: ProjectStatus;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description:
      'Whether this project is a template. Templates are hidden from the regular project/folder listings and serve as a source of notes copied into new projects.',
    default: false,
  })
  isTemplate: boolean;

  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];
}
