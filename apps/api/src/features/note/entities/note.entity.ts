import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../../project/entities/project.entity';
import { NoteHistoryEntry } from './note-history-entry.entity';
import { NoteLogEntry } from './note-log-entry.entity';

/**
 * The kind of note. `'standard'` notes are freely-editable rich text.
 * `'log'` notes instead show an append-only sequence of timestamped
 * `NoteLogEntry` records (their own `content` field is unused). `'file'`
 * notes hold a single uploaded file, stored in MinIO object storage and
 * described by the `file*` columns. `'url'` notes store a single URL in
 * `content`, which must be a well-formed `http(s)://` URL; unlike other
 * type-specific columns, no extra fetching/unfurling is performed. `'ip'`
 * notes store a single IPv4 or IPv6 address in `content`. The `type` itself
 * is set once at creation and never changed afterwards.
 */
export type NoteType = 'standard' | 'log' | 'file' | 'url' | 'ip';
export const NOTE_TYPES: NoteType[] = ['standard', 'log', 'file', 'url', 'ip'];

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
      "The kind of note: 'standard' (freely-editable rich text), 'log' (append-only timestamped entries), 'file' (holds a single uploaded file stored in object storage), 'url' (content is a single well-formed URL), or 'ip' (content is a single well-formed IPv4 or IPv6 address). Set at creation and immutable afterwards.",
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

  @Column({ type: 'varchar', length: 20, nullable: true })
  @ApiProperty({
    description:
      "Optional custom hex color (e.g. '#00f2ff') for this note, used to colorize it on the canvas. When unset, falls back to the color of its first tag, if any.",
    required: false,
    nullable: true,
    type: 'string',
  })
  color: string | null;

  /**
   * IDs of this note's parent notes, if any. Not a database column — notes
   * form a directed acyclic graph via `NoteRelation` join rows, and this
   * property is populated at read time (see `NoteService.attachRelationIds`)
   * purely to carry that data through to `NoteResponseDto` without callers
   * needing a separate request.
   */
  parentIds?: number[];

  /** IDs of this note's child notes, if any. See `parentIds` for details. */
  childIds?: number[];

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

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description:
      "Object storage key of the file uploaded to this note (only set for 'file'-type notes that have a file). Internal — never exposed through the API's response DTOs.",
    required: false,
    nullable: true,
  })
  fileKey: string | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description:
      'Original name of the file uploaded to this note, as provided by the client.',
    required: false,
    nullable: true,
  })
  fileName: string | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'MIME type of the file uploaded to this note.',
    required: false,
    nullable: true,
  })
  fileMimeType: string | null;

  // `bigint` (rather than `int`) so files larger than 2 GB are representable;
  // the transformer converts the driver's string representation back to a
  // number, since JS numbers hold byte counts far beyond any realistic upload.
  @Column({
    type: 'bigint',
    nullable: true,
    transformer: {
      to: (value: number | null): number | null => value,
      from: (value: string | null): number | null =>
        value === null ? null : Number(value),
    },
  })
  @ApiProperty({
    description: 'Size in bytes of the file uploaded to this note.',
    required: false,
    nullable: true,
    type: 'number',
  })
  fileSize: number | null;

  @OneToMany(() => NoteHistoryEntry, (entry) => entry.note)
  history: NoteHistoryEntry[];

  @OneToMany(() => NoteLogEntry, (entry) => entry.note)
  logEntries: NoteLogEntry[];
}
