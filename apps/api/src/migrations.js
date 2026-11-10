import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const MIGRATION_LOCK = 718240601;

export async function migrateDatabase(pool, rootDirectory) {
  const client = await pool.connect();
  let locked = false;
  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
    locked = true;
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    const directory = resolve(rootDirectory, 'database/migrations');
    const files = (await readdir(directory))
      .filter(name => /^\d{3,}_[a-z0-9_-]+\.sql$/i.test(name))
      .sort();

    for (const file of files) {
      const version = file.split('_', 1)[0];
      const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version=$1', [version]);
      if (applied.rowCount) continue;
      await client.query('BEGIN');
      try {
        await client.query(await readFile(join(directory, file), 'utf8'));
        await client.query('INSERT INTO schema_migrations(version) VALUES($1)', [version]);
        await client.query('COMMIT');
        console.log('Applied database migration', file);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    if (locked) await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => {});
    client.release();
  }
}
