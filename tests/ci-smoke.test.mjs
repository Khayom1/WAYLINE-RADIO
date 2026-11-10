import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('CI smoke script expands required environment variables in Bash', async () => {
  const script = await readFile(new URL('../scripts/ci-smoke.sh', import.meta.url), 'utf8');
  for (const name of ['POSTGRES_PASSWORD', 'JWT_SECRET', 'ICECAST_SOURCE_PASSWORD', 'ICECAST_ADMIN_PASSWORD']) {
    assert.match(script, new RegExp('\\\\$\\\\{' + name + '\\\\}'));
    assert.doesNotMatch(script, new RegExp('\\\\\\\\\\\\$\\\\{' + name));
  }
});
