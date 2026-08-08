import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';
import { NoteHistoryEntry } from './note-history-entry.entity';

// Supported note types. Each type renders differently in the UI and may use
// the `config` field to store type-specific settings. Add new types here as
// they are implemented.
// - 'markdown': plain markdown content (stored in `content`).
// - 'iframe': embeds an external page; `config.url` holds the iframe source.
// - 'log': has no content of its own; its detail view directly displays the
//   note's automatic change history (see `NoteHistoryEntry`) as its primary
//   content, rather than tucking it away in a collapsible section like
//   other note types.
// - 'socialMedia': tracks a social media account; `config.platform`,
//   `config.username`, and `config.profileUrl` hold the account details.
export type NoteType = 'markdown' | 'iframe' | 'log' | 'socialMedia';
export const NOTE_TYPES: NoteType[] = [
  'markdown',
  'iframe',
  'log',
  'socialMedia',
];

@Entity()
export class Note extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the project this note belongs to' })
  projectId: number;

  @ManyToOne(() => Project, (project) => project.notes)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 30, default: 'markdown' })
  @ApiProperty({
    description: 'The type of note, determines how it is rendered',
    enum: NOTE_TYPES,
    default: 'markdown',
  })
  type: NoteType;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Content of the note' })
  content: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description:
      'Type-specific configuration object for the note (used by non-markdown note types)',
    type: Object,
    required: false,
    nullable: true,
  })
  config: Record<string, unknown> | null;

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

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Plain text tags of the note',
    type: [String],
    required: false,
  })
  tags: string[];

  @Column({ type: 'double precision', nullable: true })
  @ApiProperty({
    description: 'X coordinate of the note on the canvas view',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasX: number | null;

  @Column({ type: 'double precision', nullable: true })
  @ApiProperty({
    description: 'Y coordinate of the note on the canvas view',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasY: number | null;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({
    description:
      'ID of the parent note this note is nested under, if any. Null means the note is a top-level (root) note.',
    required: false,
    nullable: true,
    type: 'number',
  })
  parentId: number | null;

  @ManyToOne(() => Note, (note) => note.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Note | null;

  @OneToMany(() => Note, (note) => note.parent)
  children: Note[];

  @OneToMany(() => NoteHistoryEntry, (entry) => entry.note)
  history: NoteHistoryEntry[];
}
