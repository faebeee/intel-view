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
 * `NoteLogEntry` records (their own `content` field is unused). `'address'`
 * notes store a physical address in `content`, which is automatically
 * resolved to map coordinates (see `latitude`/`longitude`) whenever the note
 * is created or its `content` is updated. Set once at creation and never
 * changed afterwards.
 */
export type NoteType = 'standard' | 'log' | 'address';
export const NOTE_TYPES: NoteType[] = ['standard', 'log', 'address'];

/** Outcome of the most recent attempt to geocode an `'address'` note's `content`. */
export type NoteGeocodeStatus = 'resolved' | 'failed';
export const NOTE_GEOCODE_STATUSES: NoteGeocodeStatus[] = [
  'resolved',
  'failed',
];

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
      "The kind of note: 'standard' (freely-editable rich text), 'log' (append-only timestamped entries), or 'address' (content is a physical address, automatically resolved to coordinates). Set at creation and immutable afterwards.",
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

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description:
      'X position of this note on the project canvas view, if it has been placed there.',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasX: number | null;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description:
      'Y position of this note on the project canvas view, if it has been placed there.',
    required: false,
    nullable: true,
    type: 'number',
  })
  canvasY: number | null;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description:
      "Latitude resolved from this note's `content` (only set for `'address'`-type notes with a successfully geocoded address).",
    required: false,
    nullable: true,
    type: 'number',
  })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({
    description:
      "Longitude resolved from this note's `content` (only set for `'address'`-type notes with a successfully geocoded address).",
    required: false,
    nullable: true,
    type: 'number',
  })
  longitude: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({
    description:
      "Outcome of the most recent attempt to geocode this note's `content` (only applicable to `'address'`-type notes). Null until a save has been attempted.",
    enum: NOTE_GEOCODE_STATUSES,
    required: false,
    nullable: true,
  })
  geocodeStatus: NoteGeocodeStatus | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description:
      'Human-readable place name returned by the geocoding provider for this address note, if resolution succeeded.',
    required: false,
    nullable: true,
  })
  geocodedLabel: string | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description:
      'Explanation of why geocoding failed for this address note, if resolution did not succeed.',
    required: false,
    nullable: true,
  })
  geocodeError: string | null;

  @OneToMany(() => NoteHistoryEntry, (entry) => entry.note)
  history: NoteHistoryEntry[];

  @OneToMany(() => NoteLocation, (location) => location.note)
  locations: NoteLocation[];

  @OneToMany(() => NoteLogEntry, (entry) => entry.note)
  logEntries: NoteLogEntry[];
}
