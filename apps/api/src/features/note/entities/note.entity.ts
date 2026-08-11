import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';
import { NoteHistoryEntry } from './note-history-entry.entity';
import { NoteLocation } from './note-location.entity';
import { NoteLogEntry } from './note-log-entry.entity';

/**
 * The kind of note. `'standard'` notes are freely-editable rich text.
 * `'log'` notes instead show an append-only sequence of timestamped
 * `NoteLogEntry` records (their own `content` field is unused). Set once at
 * creation and never changed afterwards.
 */
export type NoteType = 'standard' | 'log';
export const NOTE_TYPES: NoteType[] = ['standard', 'log'];

@Entity()
export class Note extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the project this note belongs to' })
  projectId: number;

  @ManyToOne(() => Project, (project) => project.notes)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  @ApiProperty({
    description:
      "The kind of note: 'standard' (freely-editable rich text) or 'log' (append-only timestamped entries). Set at creation and immutable afterwards.",
    enum: NOTE_TYPES,
    default: 'standard',
  })
  type: NoteType;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Title of the note' })
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ description: 'Markdown content of the note' })
  content: string;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description: 'Plain text tags of the note',
    type: [String],
    required: false,
  })
  tags: string[];

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

  @OneToMany(() => NoteLocation, (location) => location.note)
  locations: NoteLocation[];

  @OneToMany(() => NoteLogEntry, (entry) => entry.note)
  logEntries: NoteLogEntry[];
}
