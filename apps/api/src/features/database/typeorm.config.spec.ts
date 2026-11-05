import { buildTypeOrmOptions, shouldSynchronize } from './typeorm.config';

describe('shouldSynchronize', () => {
  it('is off in production — the Dockerfile sets NODE_ENV=production (TD-0.6)', () => {
    expect(shouldSynchronize({ NODE_ENV: 'production' })).toBe(false);
  });

  it('is on in development', () => {
    expect(shouldSynchronize({ NODE_ENV: 'development' })).toBe(true);
  });

  it('is on when NODE_ENV is unset', () => {
    expect(shouldSynchronize({})).toBe(true);
  });

  it('is on under test', () => {
    expect(shouldSynchronize({ NODE_ENV: 'test' })).toBe(true);
  });

  describe('DB_SYNCHRONIZE override', () => {
    it('can force it on in production, for standing up a fresh database', () => {
      expect(
        shouldSynchronize({ NODE_ENV: 'production', DB_SYNCHRONIZE: 'true' }),
      ).toBe(true);
    });

    it('can force it off outside production', () => {
      expect(
        shouldSynchronize({ NODE_ENV: 'development', DB_SYNCHRONIZE: 'false' }),
      ).toBe(false);
    });

    it.each(['TRUE', 'True', ' true '])('accepts %p', (value) => {
      expect(
        shouldSynchronize({ NODE_ENV: 'production', DB_SYNCHRONIZE: value }),
      ).toBe(true);
    });

    it.each(['yes', '1', '', 'nope'])(
      'ignores the unparseable value %p and keeps the NODE_ENV default',
      (value) => {
        // A typo must not read as `false` in dev (broken local schema) or as
        // truthy in production (the bug this task exists to fix).
        expect(
          shouldSynchronize({ NODE_ENV: 'production', DB_SYNCHRONIZE: value }),
        ).toBe(false);
        expect(
          shouldSynchronize({ NODE_ENV: 'development', DB_SYNCHRONIZE: value }),
        ).toBe(true);
      },
    );
  });
});

describe('buildTypeOrmOptions', () => {
  it('reads the discrete DB_* variables', () => {
    const options = buildTypeOrmOptions({
      DB_HOST: 'db',
      DB_PORT: '6543',
      DB_USERNAME: 'intel',
      DB_PASSWORD: 'secret',
      DB_DATABASE: 'intel_view_prod',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'db',
      port: 6543,
      username: 'intel',
      password: 'secret',
      database: 'intel_view_prod',
    });
  });

  it('falls back to the docker-compose defaults', () => {
    expect(buildTypeOrmOptions({})).toMatchObject({
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'intel_view',
    });
  });

  it('does not synchronize in production', () => {
    expect(buildTypeOrmOptions({ NODE_ENV: 'production' })).toMatchObject({
      synchronize: false,
    });
  });

  it('does not run migrations on boot until TD-4.1 lands a baseline', () => {
    // The five existing migrations are decorative ALTERs that assume the base
    // tables exist; running them on boot today would fail and take the API
    // down. The glob is configured so TD-4.1 only has to flip this flag.
    const options = buildTypeOrmOptions({});
    expect(options).toMatchObject({ migrationsRun: false });
    expect(options.migrations).toHaveLength(1);
  });

  it('autoloads entities', () => {
    expect(buildTypeOrmOptions({})).toMatchObject({ autoLoadEntities: true });
  });
});
