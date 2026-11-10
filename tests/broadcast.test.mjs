import test from 'node:test';
import assert from 'node:assert/strict';
import { audioExtension, hasAudioSignature } from '../apps/api/src/media.js';
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
