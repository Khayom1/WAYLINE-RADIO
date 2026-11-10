import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { randomBytes, scryptSync } from 'node:crypto';
import { Pool } from 'pg';

if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const rl=createInterface({input,output});const ask=(q)=>rl.question(q);
try{
  const email=(await ask('Admin email: ')).trim().toLowerCase();
  const password=await ask('Password (minimum 12 characters): ');
  const role=(await ask('Role [platform_admin/company_admin] (default platform_admin): ')).trim()||'platform_admin';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Invalid email.');
  if(password.length<12)throw new Error('Password must contain at least 12 characters.');
  if(!['platform_admin','company_admin'].includes(role))throw new Error('Invalid role.');
  const salt=randomBytes(16).toString('hex');const hash=salt+':'+scryptSync(password,salt,64).toString('hex');
  const db=new Pool({connectionString:process.env.DATABASE_URL});
  const result=await db.query('INSERT INTO users(email,password_hash,role) VALUES($1,$2,$3) RETURNING id,email,role',[email,hash,role]);
  if(role==='company_admin'){
    const slug=(await ask('Company slug (e.g. cnu): ')).trim();
    const company=await db.query('SELECT id FROM companies WHERE slug=$1',[slug]);
    if(!company.rowCount)throw new Error('Company not found. Create it first or use platform_admin.');
    await db.query('INSERT INTO company_memberships(user_id,company_id,role) VALUES($1,$2,$3)',[result.rows[0].id,company.rows[0].id,'company_admin']);
  }
  console.log('Created:',result.rows[0]);await db.end();
}catch(error){console.error(error.message);process.exitCode=1;}finally{rl.close();}