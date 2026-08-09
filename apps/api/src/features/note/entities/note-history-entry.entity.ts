import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/** The kind of event a `NoteHistoryEntry` records. */
export type NoteHistoryChangeType = 'created' | 'updated';
export const NOTE_HISTORY_CHANGE_TYPES: NoteHistoryChangeType[] = [
  'created',
  'updated',
];

/** A single field-level diff captured within an 'updated' history entry. */
export type NoteFieldChange = {
  field: string;
  previousValue: unknown;
  newValue: unknown;
};

/**
 * Immutable audit-trail record of a change made to a `Note`. One 'created'
 * entry is recorded when the note is made, and one 'updated' entry is
 * recorded per `update()` call that actually changes one or more tracked
 * fields (bundling all field diffs from that call into a single entry).
 * Entries are never edited or removed once written, so a note's `history`
 * relation always reflects its full change history in chronological order.
 */
@Entity()
export class NoteHistoryEntry extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the note this history entry belongs to' })
  noteId: number;

  @ManyToOne(() => Note, (note) => note.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'varchar', length: 20 })
  @ApiProperty({
    description:
      "The kind of event this entry records: 'created' when the note was made, 'updated' for a subsequent edit",
    enum: NOTE_HISTORY_CHANGE_TYPES,
  })
  changeType: NoteHistoryChangeType;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description:
      "For 'updated' entries, the list of fields that changed in that edit, each with their previous and new value. Null for 'created' entries.",
    type: [Object],
    required: false,
    nullable: true,
  })
  changes: NoteFieldChange[] | null;
}
