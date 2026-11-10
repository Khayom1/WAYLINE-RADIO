import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { canBroadcastTrack } from '../../api/src/policy.js';
import { ffconcatFile, managedAudioPath, safeMount } from './broadcast-policy.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: true } : undefined, max: 4 });
const MEDIA_DIR = resolve(process.env.MEDIA_DIR || '/var/wayline-media');
const PLAYLIST_DIR = resolve(process.env.BROADCAST_PLAYLIST_DIR || '/var/wayline-broadcast');
const ICECAST_HOST = process.env.ICECAST_HOST || 'icecast';
const ICECAST_PORT = Math.max(1, Math.min(65535, Number(process.env.ICECAST_PORT || 8000)));
const SOURCE_PASSWORD = process.env.ICECAST_SOURCE_PASSWORD || '';
const BITRATE = /^[0-9]{2,3}k$/.test(process.env.BROADCAST_BITRATE || '') ? process.env.BROADCAST_BITRATE : '128k';
const POLL_RAW = Number(process.env.BROADCAST_POLL_MS || 15000);
const POLL_MS = Number.isFinite(POLL_RAW) ? Math.max(5000, Math.min(120000, POLL_RAW)) : 15000;
const jobs = new Map();
let busy = false;
let stopping = false;
let timer;

async function stopJob(slug) {
  const job = jobs.get(slug);
  if (!job) return;
  jobs.delete(slug);
  if (job.child && job.child.exitCode === null && !job.child.killed) {
    await new Promise(resolveExit => {
      const timeout = setTimeout(() => job.child.kill('SIGKILL'), 3000);
      job.child.once('exit', () => { clearTimeout(timeout); resolveExit(); });
      job.child.kill('SIGTERM');
    });
  }
  await rm(job.playlist, { force: true }).catch(() => {});
}

function startJob(slug, tracks, playlist, signature) {
  const target = 'icecast://source:' + encodeURIComponent(SOURCE_PASSWORD) + '@' + ICECAST_HOST + ':' + ICECAST_PORT + '/' + encodeURIComponent(slug);
  const args = [
    '-nostdin', '-hide_banner', '-loglevel', 'warning',
    '-re', '-stream_loop', '-1', '-f', 'concat', '-safe', '0', '-i', playlist,
    '-map', '0:a:0', '-vn', '-c:a', 'libmp3lame', '-b:a', BITRATE, '-ar', '44100',
    '-content_type', 'audio/mpeg', '-f', 'mp3', target
  ];
  const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const job = { child, playlist, signature, lastExitAt: 0 };
  jobs.set(slug, job);
  let errorText = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { errorText = (errorText + chunk).slice(-1500); });
  child.once('error', error => {
    console.error('Broadcaster process error for', slug, error.message);
    if (jobs.get(slug) === job) { job.child = null; job.lastExitAt = Date.now(); }
  });
  child.once('exit', (code, signal) => {
    console.warn('Broadcast process stopped for', slug, { code, signal, detail: errorText.trim().slice(-600) });
    if (jobs.get(slug) === job) { job.child = null; job.lastExitAt = Date.now(); }
  });
  console.log('Starting live mount', '/' + slug, 'with', tracks.length, 'rights-cleared tracks');
}

async function tick() {
  if (busy || stopping) return;
  busy = true;
  try {
    await mkdir(PLAYLIST_DIR, { recursive: true });
    const result = await pool.query(
      'SELECT s.slug AS station_slug, t.* FROM stations s JOIN companies c ON c.id=s.company_id JOIN tracks t ON t.company_id=s.company_id WHERE s.is_active=true AND c.is_active=true AND t.is_active=true AND t.audio_file_path IS NOT NULL ORDER BY s.slug, t.created_at, t.id'
    );
    const grouped = new Map();
    for (const track of result.rows) {
      const slug = String(track.station_slug || '');
      if (!safeMount(slug) || !canBroadcastTrack(track).allowed) continue;
      const file = managedAudioPath(track.audio_file_path);
      if (!file) { console.error('Rejected unsafe managed audio path on track', track.id); continue; }
      try {
        const info = await stat(file);
        if (!info.isFile() || info.size < 1024) continue;
      } catch { continue; }
      if (!grouped.has(slug)) grouped.set(slug, []);
      grouped.get(slug).push({ id: track.id, file });
    }

    for (const [slug, tracks] of grouped) {
      const list = tracks.map(item => item.file);
      const signature = createHash('sha256').update(list.join('\n')).digest('hex');
      const playlist = resolve(PLAYLIST_DIR, slug + '.ffconcat');
      const current = jobs.get(slug);
      const alive = current?.child && current.child.exitCode === null && !current.child.killed;
      if (current?.signature === signature && alive) continue;
      if (current?.signature === signature && !alive && current.lastExitAt && Date.now() - current.lastExitAt < 30000) continue;
      if (current) await stopJob(slug);
      const temporary = playlist + '.tmp';
      await writeFile(temporary, ffconcatFile(list), { mode: 0o640 });
      await rename(temporary, playlist);
      startJob(slug, tracks, playlist, signature);
    }

    for (const slug of [...jobs.keys()]) {
      if (!grouped.has(slug)) await stopJob(slug);
    }
  } catch (error) {
    console.error('Broadcaster cycle failed:', error);
  } finally {
    busy = false;
  }
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await Promise.all([...jobs.keys()].map(stopJob));
  await pool.end();
}

if (!SOURCE_PASSWORD) {
  console.error('ICECAST_SOURCE_PASSWORD is required for the broadcaster.');
  process.exit(1);
}
await tick();
timer = setInterval(tick, POLL_MS);
process.on('SIGTERM', () => shutdown().finally(() => process.exit(0)));
process.on('SIGINT', () => shutdown().finally(() => process.exit(0)));
console.log('WAYLINE broadcaster active; poll interval', POLL_MS, 'ms');
