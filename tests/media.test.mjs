import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { audioExtension, hasAudioSignature, storeAudio, MAX_AUDIO_BYTES } from '../apps/api/src/media.js';

const mp3 = Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2045)]);

function request(buffer, contentType = 'audio/mpeg', filename = 'track.mp3') {
  const stream = Readable.from([buffer]);
  stream.headers = { 'content-type': contentType, 'x-audio-filename': filename, 'content-length': String(buffer.length) };
  return stream;
}

test('audio MIME and signature checks reject mismatched uploads', () => {
  assert.equal(audioExtension('audio/mpeg'), '.mp3');
  assert.equal(audioExtension('application/octet-stream', 'track.wav'), '.wav');
  assert.equal(audioExtension('application/octet-stream', 'track.exe'), null);
  assert.equal(hasAudioSignature(mp3.subarray(0, 16), '.mp3'), true);
  assert.equal(hasAudioSignature(Buffer.from('not audio data'), '.mp3'), false);
});

test('audio upload enforces the byte limit before normalization', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wayline-audio-'));
  try {
    const oversized = request(Buffer.alloc(MAX_AUDIO_BYTES + 1, 1));
    await assert.rejects(storeAudio(oversized, directory, { normalize: async () => {} }), error => error.status === 413);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('valid upload is stored only after normalization and temporary source is removed', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wayline-audio-'));
  try {
    const result = await storeAudio(request(mp3), directory, {
      normalize: async (_input, output) => writeFile(output, Buffer.concat([Buffer.from('ID3'), Buffer.alloc(2045)]))
    });
    assert.match(result.path, /^uploads\/[a-f0-9-]{36}\.mp3$/i);
    assert.equal(result.mime, 'audio/mpeg');
    assert.equal(result.size, 2048);
    assert.equal((await readFile(join(directory, result.path))).length, 2048);
    const uploads = await (await import('node:fs/promises')).readdir(join(directory, 'uploads'));
    assert.equal(uploads.length, 1);
    assert.ok(uploads[0].endsWith('.mp3'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
