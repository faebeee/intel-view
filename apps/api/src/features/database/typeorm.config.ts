import { join } from 'node:path';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Reads a boolean environment variable. Anything other than an explicit
 * `true`/`false` (case-insensitive) is treated as unset so a typo falls back
 * to the safe default rather than silently reading as `false`.
 */
function readBooleanEnv(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    return true;
  }
  if (normalized === 'false') {
    return false;
  }
  return undefined;
}

/**
 * Whether TypeORM should auto-alter the schema to match the entities on boot.
 *
 * Defaults to on outside production and off in production: `apps/api/Dockerfile`
 * sets `NODE_ENV=production`, so an unconditional `true` means every production
 * boot rewrites the live schema — silent data loss when a column is renamed or
 * dropped. `DB_SYNCHRONIZE` is an explicit, deliberate override, needed today to
 * stand up a fresh production database because no baseline migration exists yet
 * (see TD-4.1).
 */
export function shouldSynchronize(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return readBooleanEnv(env.DB_SYNCHRONIZE) ?? env.NODE_ENV !== 'production';
}

/**
 * Builds the runtime TypeORM options for `TypeOrmModule.forRoot`.
 *
 * Note this is a *second*, independent connection mechanism: standalone CLI
 * commands (migrations, seeding) go through `datasource.ts`, which reads a
 * single `DATABASE_URL` instead of the discrete `DB_*` variables used here.
 * Keep the two in sync.
 */
export function buildTypeOrmOptions(
  env: NodeJS.ProcessEnv = process.env,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST || 'localhost',
    port: parseInt(env.DB_PORT || '5432', 10),
    username: env.DB_USERNAME || 'postgres',
    password: env.DB_PASSWORD || 'postgres',
    database: env.DB_DATABASE || 'intel_view',
    entities: [],
    autoLoadEntities: true,
    synchronize: shouldSynchronize(env),
    // Discovered so TD-4.1 only has to flip `migrationsRun`. Deliberately NOT
    // run on boot yet: the five existing migrations are decorative `ALTER`s
    // that assume the base tables already exist, so running them against
    // either a fresh database or a `synchronize`-built one fails and takes the
    // API down with it. See TD-0.6 / TD-4.1.
    migrations: [join(__dirname, '..', '..', 'migrations', '*{.ts,.js}')],
    migrationsRun: false,
  };
}
