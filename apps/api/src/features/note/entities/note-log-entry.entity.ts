import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/**
 * A single user-authored, append-only entry in a "log"-type note. Unlike
 * `NoteHistoryEntry` (an automatic audit trail of field diffs), these are
 * explicitly created by the user via the log note's "Save" action and are
 * never edited or replaced — a log note's `logEntries` relation always
 * reflects the full sequence of everything ever logged to it.
 */
@Entity()
export class NoteLogEntry extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the note this log entry belongs to' })
  noteId: number;

  @ManyToOne(() => Note, (note) => note.logEntries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Markdown content of this log entry' })
  content: string;
}
