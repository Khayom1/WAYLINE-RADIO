import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { audioExtension, hasAudioSignature, storeAudio } from '../apps/api/src/media.js';
import { ffconcatFile, managedAudioPath, safeMount } from '../apps/worker/src/broadcast-policy.js';

test('managed audio paths accept only generated upload names below the media root', () => {
  const root = '/var/wayline-media';
  assert.equal(managedAudioPath('uploads/4d1f4d12-03d6-4c5f-9d4f-5d9c2c9b11a1.mp3', root),
    '/var/wayline-media/uploads/4d1f4d12-03d6-4c5f-9d4f-5d9c2c9b11a1.mp3');
  for (const value of ['../../etc/passwd', '/etc/passwd', 'uploads/../../etc/passwd',
    'uploads/not-a-uuid.mp3', 'uploads/4d1f4d12-03d6-4c5f-9d4f-5d9c2c9b11a1.exe', null]) {
    assert.equal(managedAudioPath(value, root), null, String(value));
  }
});

test('station mount names are constrained to safe URL path segments', () => {
  assert.equal(safeMount('cnu-radio'), true);
  assert.equal(safeMount('etl-radio-2'), true);
  for (const value of ['../admin', 'cnu/radio', '', '-radio', 'radio name', null]) {
    assert.equal(safeMount(value), false, String(value));
  }
});

test('FFmpeg concat playlist quotes every file path as one entry', () => {
  assert.equal(ffconcatFile(['/var/wayline-media/uploads/a.mp3', '/var/media/my song.mp3']),
    "file '/var/wayline-media/uploads/a.mp3'\nfile '/var/media/my song.mp3'\n");
  assert.ok(ffconcatFile(["/tmp/a'b.mp3"]).startsWith("file '/tmp/a"));
});

test('audio uploads are restricted to supported audio types and matching signatures', () => {
  assert.equal(audioExtension('audio/mpeg'), '.mp3');
  assert.equal(audioExtension('application/octet-stream', 'song.flac'), '.flac');
  assert.equal(audioExtension('text/html', 'song.mp3'), null);
  assert.equal(hasAudioSignature(Buffer.from('ID3' + 'x'.repeat(16)), '.mp3'), true);
  assert.equal(hasAudioSignature(Buffer.from('RIFF0000WAVEfmt '), '.wav'), true);
  assert.equal(hasAudioSignature(Buffer.from('<html>not audio</html>'), '.mp3'), false);
});


test('audio upload stores bounded verified media with a generated private filename', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wayline-media-test-'));
  try {
    const bytes = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2048, 7)]);
    const request = Readable.from([bytes]);
    request.headers = { 'content-type': 'audio/mpeg', 'content-length': String(bytes.length), 'x-audio-filename': 'song.mp3' };
    const saved = await storeAudio(request, root);
    assert.match(saved.path, /^uploads\/[a-f0-9-]{36}\.mp3$/i);
    assert.equal(saved.mime, 'audio/mpeg');
    assert.equal(saved.size, bytes.length);
    assert.deepEqual(await readFile(saved.file), bytes);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('audio upload rejects mismatched content and removes partial files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'wayline-media-test-'));
  try {
    const request = Readable.from([Buffer.from('<html>' + 'x'.repeat(2000))]);
    request.headers = { 'content-type': 'audio/mpeg', 'content-length': '2013', 'x-audio-filename': 'fake.mp3' };
    await assert.rejects(storeAudio(request, root), error => error.status === 415);
    const { readdir } = await import('node:fs/promises');
    assert.deepEqual(await readdir(join(root, 'uploads')).catch(() => []), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
