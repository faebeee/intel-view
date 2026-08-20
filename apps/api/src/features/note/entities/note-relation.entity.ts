import { BaseEntity } from '../../database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Note } from './note.entity';

/**
 * A single directed parent -> child link between two notes. Notes form a
 * directed acyclic graph (DAG) rather than a strict tree: a note may have
 * any number of parents and any number of children, so long as no cycle is
 * created (enforced by `NoteService.assertLinkValid`). Deleting a note only
 * removes the `NoteRelation` rows it directly participates in (as either
 * `parentId` or `childId`) — it never cascades to its children, since they
 * may still be reachable through other parents.
 */
@Entity()
@Unique(['parentId', 'childId'])
export class NoteRelation extends BaseEntity {
  @Column()
  @ApiProperty({ description: 'ID of the parent note in this link' })
  parentId: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Note;

  @Column()
  @ApiProperty({ description: 'ID of the child note in this link' })
  childId: number;

  @ManyToOne(() => Note, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child: Note;
}
