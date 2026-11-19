import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional `version` column to `note`, holding the version of the
 * software/service a custom software note describes (e.g. 'OpenSSH 8.9p1').
 */
export class AddNoteVersion1794200000000 implements MigrationInterface {
  name = 'AddNoteVersion1794200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "note" ADD COLUMN "version" character varying(100);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "version";`);
  }
}
