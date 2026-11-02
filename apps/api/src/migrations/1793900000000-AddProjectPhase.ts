import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an optional `phase` column to `project`, naming the penetration-test
 * phase currently in progress (shown as the phase progress bar on the
 * project canvas). Existing projects stay null, i.e. not started.
 */
export class AddProjectPhase1793900000000 implements MigrationInterface {
  name = 'AddProjectPhase1793900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD COLUMN "phase" character varying(24);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "phase";`);
  }
}
