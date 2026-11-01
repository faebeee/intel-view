import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Widens `note.type` from `varchar(20)` to `varchar(40)`. `type` used to be
 * a closed set of five built-in kinds but is now an open-ended lowercase
 * slug — any value names a custom software/service note (e.g. 'ftp',
 * 'ssh') in addition to the built-ins ('standard', 'log', 'file', 'url',
 * 'ip') — so the column needs more room than the longest built-in name.
 */
export class WidenNoteType1793533968422 implements MigrationInterface {
  name = 'WidenNoteType1793533968422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ALTER COLUMN "type" TYPE character varying(40);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ALTER COLUMN "type" TYPE character varying(20);`,
    );
  }
}
