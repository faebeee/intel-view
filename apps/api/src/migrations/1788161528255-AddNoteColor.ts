import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional `color` column to `note`, letting a note be given a
 * custom display color (used to colorize it on the canvas, its map
 * pin(s), and its row in the notes tree). When unset, consumers fall back
 * to the color of the note's first tag, if any.
 */
export class AddNoteColor1788161528255 implements MigrationInterface {
  name = 'AddNoteColor1788161528255';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ADD COLUMN "color" character varying(20);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "color";`);
  }
}
