import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renames the `project_group` table/concept to `project_folder` ("Project
 * Folders"), reflecting the dashboard's new folder-first navigation (the
 * dashboard now lists folders, and clicking one reveals the projects inside
 * it). Purely a rename of the existing one-to-many grouping feature - no
 * structural/behavioral change to the relation itself (still a nullable FK
 * on `project`, still a flat/non-nested grouping).
 */
export class RenameProjectGroupToProjectFolder1791535074701 implements MigrationInterface {
  name = 'RenameProjectGroupToProjectFolder1791535074701';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project_group" RENAME TO "project_folder";`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" RENAME COLUMN "groupId" TO "folderId";`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "project_group_id_seq" RENAME TO "project_folder_id_seq";`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER SEQUENCE "project_folder_id_seq" RENAME TO "project_group_id_seq";`,
    );
    await queryRunner.query(
      `ALTER TABLE "project" RENAME COLUMN "folderId" TO "groupId";`,
    );
    await queryRunner.query(
      `ALTER TABLE "project_folder" RENAME TO "project_group";`,
    );
  }
}
