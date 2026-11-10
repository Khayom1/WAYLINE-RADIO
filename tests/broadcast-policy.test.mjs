import test from 'node:test';
import assert from 'node:assert/strict';
import { managedAudioPath, ffconcatFile, safeMount } from '../apps/worker/src/broadcast-policy.js';

test('managed audio paths accept only generated upload MP3 names', () => {
  const root = '/var/wayline-media';
  assert.equal(managedAudioPath('uploads/4d1f4d12-03d6-4c5f-9d4f-5d9c2c9b11a1.mp3', root),
    root + '/uploads/4d1f4d12-03d6-4c5f-9d4f-5d9c2c9b11a1.mp3');
  for (const path of ['../../etc/passwd', '/etc/passwd', 'uploads/song.mp3', 'uploads/' + 'a'.repeat(36) + '.wav']) {
    assert.equal(managedAudioPath(path, root), null);
  }
});

test('Icecast mount names are constrained before process launch', () => {
  assert.equal(safeMount('cnu-radio'), true);
  assert.equal(safeMount('etl-radio-2'), true);
  for (const value of ['', '../admin', 'has space', '-invalid', 'x'.repeat(81)]) assert.equal(safeMount(value), false);
});

test('FFmpeg concat paths escape quote and backslash characters', () => {
  assert.equal(ffconcatFile(['/var/audio/a.mp3', "/var/audio/it's.mp3", '/var/audio/a\\b.mp3']),
    "file '/var/audio/a.mp3'\\nfile '/var/audio/it'\\\\''s.mp3'\\nfile '/var/audio/a\\\\\\\\b.mp3'\\n");
});
