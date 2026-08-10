import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/**
 * A single geographic pin attached to a `Note`. Rows in this table are
 * derived automatically from `[[geo:LAT,LNG,LABEL]]` tokens embedded in the
 * note's markdown `content` (see `note-location.util.ts`) — they are fully
 * resynced (deleted and recreated) whenever the note's content is created or
 * updated, so this table should be treated as read-only/derived data rather
 * than edited directly.
 */
@Entity()
export class NoteLocation extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the note this location belongs to' })
  noteId: number;

  @ManyToOne(() => Note, (note) => note.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: Note;

  @Column({ type: 'float' })
  @ApiProperty({ description: 'Latitude of the pinned location' })
  lat: number;

  @Column({ type: 'float' })
  @ApiProperty({ description: 'Longitude of the pinned location' })
  lng: number;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Optional human-readable label for the pinned location',
    required: false,
    nullable: true,
  })
  label: string | null;
}
