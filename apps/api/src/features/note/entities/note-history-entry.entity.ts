import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/** The kind of event a `NoteHistoryEntry` records. */
export type NoteHistoryChangeType = 'created' | 'updated' | 'manual';
export const NOTE_HISTORY_CHANGE_TYPES: NoteHistoryChangeType[] = [
  'created',
  'updated',
  'manual',
];

/** A single field-level diff captured within an 'updated' history entry. */
export type NoteFieldChange = {
  field: string;
  previousValue: unknown;
  newValue: unknown;
};

/**
 * Immutable audit-trail record of a change made to a `Note`. Most entries
 * are created automatically by `NoteService` — one 'created' entry when the
 * note is made, and one 'updated' entry per `update()` call that actually
 * changes one or more tracked fields (bundling all field diffs from that
 * call into a single entry). `log`-type notes additionally support
 * 'manual' entries: freeform markdown notes added directly by the user
 * from the note detail view (see `NoteService.addManualEntry`). Entries
 * are never edited or removed once written, so a note's `history` relation
 * always reflects its full change history in chronological order.
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
      "The kind of event this entry records: 'created' when the note was made, 'updated' for a subsequent edit, 'manual' for a freeform entry added by the user (log notes only)",
    enum: NOTE_HISTORY_CHANGE_TYPES,
  })
  changeType: NoteHistoryChangeType;

  @Column({ type: 'json', nullable: true })
  @ApiProperty({
    description:
      "For 'updated' entries, the list of fields that changed in that edit, each with their previous and new value. Null for 'created'/'manual' entries.",
    type: [Object],
    required: false,
    nullable: true,
  })
  changes: NoteFieldChange[] | null;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description:
      "Freeform markdown content for a 'manual' entry. Null for 'created'/'updated' entries.",
    type: String,
    required: false,
    nullable: true,
  })
  content: string | null;
}
