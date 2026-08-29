import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from '../../note/entities/note.entity';
import { ProjectGroup } from '../../project-group/entities/project-group.entity';

/**
 * The base map tile layer style selected for a project's map view. Mirrors
 * the frontend's `MapThemeId` (`apps/web/src/features/map/lib/map-themes.ts`)
 * so the user's chosen look persists across sessions/devices instead of
 * always resetting to the default on each map load.
 */
export type ProjectMapTheme =
  'street' | 'satellite' | 'light' | 'dark' | 'futuristic';
export const PROJECT_MAP_THEMES: ProjectMapTheme[] = [
  'street',
  'satellite',
  'light',
  'dark',
  'futuristic',
];
export const DEFAULT_PROJECT_MAP_THEME: ProjectMapTheme = 'street';

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

  @Column({
    type: 'varchar',
    length: 20,
    default: DEFAULT_PROJECT_MAP_THEME,
  })
  @ApiProperty({
    description:
      "The selected base map tile style for this project's map view, persisted so it's remembered across sessions.",
    enum: PROJECT_MAP_THEMES,
    default: DEFAULT_PROJECT_MAP_THEME,
  })
  mapTheme: ProjectMapTheme;

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

  @OneToMany(() => Note, (note) => note.project)
  notes: Note[];
}
