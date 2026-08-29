import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Moves the `tag` table from being scoped to a single project to being a
 * globally shared resource across all projects.
 *
 * Steps:
 * 1. Dedupe tags that share the same name (case-insensitively) across
 *    different projects, keeping the most recently updated one as the
 *    "winner" (its color is preserved) and deleting the rest.
 * 2. Drop the `projectId` foreign key column from `tag` (tags are no longer
 *    tied to a specific project).
 * 3. Add a unique index on `tag.name` to enforce global uniqueness going
 *    forward (matches the `Tag` entity's `UQ_tag_name` index).
 *
 * Note: `note.tags` stores plain tag name strings (no FK to `tag.id`), so
 * notes are unaffected by this migration.
 */
export class MakeTagsGlobal1735500000000 implements MigrationInterface {
  name = 'MakeTagsGlobal1735500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Dedupe: for each case-insensitive name, keep only the tag with the
    // most recent updatedAt (ties broken by highest id), delete the rest.
    await queryRunner.query(`
      WITH ranked_tags AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(name)
            ORDER BY "updatedAt" DESC, id DESC
          ) AS rank
        FROM "tag"
      )
      DELETE FROM "tag"
      WHERE id IN (
        SELECT id FROM ranked_tags WHERE rank > 1
      );
    `);

    // 2. Drop the projectId FK column (and its constraint/index if present).
    const table = await queryRunner.getTable('tag');
    const projectFk = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes('projectId'),
    );
    if (projectFk) {
      await queryRunner.dropForeignKey('tag', projectFk);
    }
    const hasProjectIdColumn = table?.columns.some(
      (column) => column.name === 'projectId',
    );
    if (hasProjectIdColumn) {
      await queryRunner.query(`ALTER TABLE "tag" DROP COLUMN "projectId";`);
    }

    // 3. Enforce global uniqueness on tag name.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_tag_name" ON "tag" ("name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_tag_name";`);
    await queryRunner.query(
      `ALTER TABLE "tag" ADD COLUMN "projectId" integer;`,
    );
    // Note: dedupe deletions cannot be reversed; the down migration only
    // restores the schema shape, not the previously deleted rows.
  }
}
