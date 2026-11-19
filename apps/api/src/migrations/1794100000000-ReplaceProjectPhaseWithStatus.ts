import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replaces the penetration-test `phase` column on `project` with a simple
 * lifecycle `status` ('planned' | 'ongoing' | 'completed'). Existing
 * projects are mapped as: no phase or 'planning' -> 'planned', 'completed'
 * -> 'completed', any other (in-progress) phase -> 'ongoing'.
 */
export class ReplaceProjectPhaseWithStatus1794100000000 implements MigrationInterface {
  name = 'ReplaceProjectPhaseWithStatus1794100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD COLUMN "status" character varying(20) NOT NULL DEFAULT 'planned';`,
    );
    await queryRunner.query(
      `UPDATE "project" SET "status" = CASE
        WHEN "phase" IS NULL OR "phase" = 'planning' THEN 'planned'
        WHEN "phase" = 'completed' THEN 'completed'
        ELSE 'ongoing'
      END;`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "phase";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" ADD COLUMN "phase" character varying(24);`,
    );
    await queryRunner.query(
      `UPDATE "project" SET "phase" = CASE "status"
        WHEN 'ongoing' THEN 'recon'
        WHEN 'completed' THEN 'completed'
        ELSE NULL
      END;`,
    );
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "status";`);
  }
}
