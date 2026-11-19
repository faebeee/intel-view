import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds an `isTemplate` flag to `project`. Template projects are hidden from
 * the regular project/folder listings and serve as a source of notes copied
 * into newly created projects. Existing projects stay regular projects.
 */
export class AddProjectIsTemplate1794000000000 implements MigrationInterface {
  name = 'AddProjectIsTemplate1794000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD COLUMN "isTemplate" boolean NOT NULL DEFAULT false;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "isTemplate";`);
  }
}
