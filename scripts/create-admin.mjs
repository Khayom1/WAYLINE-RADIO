import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomBytes, scryptSync } from 'node:crypto';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const rl = createInterface({ input, output });
const ask = question => rl.question(question);
const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined });
let client;
try {
  const email = (await ask('Admin email: ')).trim().toLowerCase();
  const password = await ask('Password (minimum 12 characters): ');
  const role = (await ask('Role [platform_admin/company_admin] (default platform_admin): ')).trim() || 'platform_admin';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email.');
  if (password.length < 12) throw new Error('Password must contain at least 12 characters.');
  if (!['platform_admin', 'company_admin'].includes(role)) throw new Error('Invalid role.');

  let companyId = null;
  if (role === 'company_admin') {
    const slug = (await ask('Company slug (e.g. cnu): ')).trim();
    const company = await db.query('SELECT id FROM companies WHERE slug=$1 AND is_active=true', [slug]);
    if (!company.rowCount) throw new Error('Company not found. Create it first or use platform_admin.');
    companyId = company.rows[0].id;
  }

  const salt = randomBytes(16).toString('hex');
  const hash = salt + ':' + scryptSync(password, salt, 64).toString('hex');
  client = await db.connect();
  await client.query('BEGIN');
  const result = await client.query(
    'INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3) RETURNING id,email,role',
    [email, hash, role]
  );
  if (companyId) {
    await client.query(
      'INSERT INTO company_memberships(user_id,company_id,role) VALUES($1,$2,$3)',
      [result.rows[0].id, companyId, 'company_admin']
    );
  }
  await client.query('COMMIT');
  console.log('Created administrator:', result.rows[0]);
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  client?.release();
  await db.end();
  rl.close();
}
