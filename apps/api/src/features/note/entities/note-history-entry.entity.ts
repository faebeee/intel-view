import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/**
 * The kind of event a `NoteHistoryEntry` records. `'link_added'`/
 * `'link_removed'` record a parent/child relation being added to or removed
 * from this note (see `relatedNoteId`/`direction`); they're recorded
 * separately from `'updated'` field diffs since relations aren't a plain
 * column on `Note`.
 */
export type NoteHistoryChangeType =
  'created' | 'updated' | 'link_added' | 'link_removed';
export const NOTE_HISTORY_CHANGE_TYPES: NoteHistoryChangeType[] = [
  'created',
  'updated',
  'link_added',
  'link_removed',
];

/** Which side of a parent/child relation this note was on, for `'link_added'`/`'link_removed'` entries. */
export type NoteHistoryLinkDirection = 'parent' | 'child';
export const NOTE_HISTORY_LINK_DIRECTIONS: NoteHistoryLinkDirection[] = [
  'parent',
  'child',
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
      "For 'updated' entries, the list of fields that changed in that edit, each with their previous and new value. Null for 'created'/'link_added'/'link_removed' entries.",
    type: [Object],
    required: false,
    nullable: true,
  })
  changes: NoteFieldChange[] | null;

  @Column({ type: 'int', nullable: true })
  @ApiProperty({
    description:
      "For 'link_added'/'link_removed' entries, the ID of the other note involved in the relation. Null otherwise.",
    required: false,
    nullable: true,
    type: 'number',
  })
  relatedNoteId: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @ApiProperty({
    description:
      "For 'link_added'/'link_removed' entries, whether `relatedNoteId` was added/removed as this note's parent or child. Null otherwise.",
    enum: NOTE_HISTORY_LINK_DIRECTIONS,
    required: false,
    nullable: true,
  })
  direction: NoteHistoryLinkDirection | null;
}
