import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export const MAX_AUDIO_BYTES = 30 * 1024 * 1024;
const AUDIO_TYPES = {
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'audio/mp4',
  '.aac': 'audio/aac', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.ogg': 'audio/ogg', '.opus': 'audio/ogg', '.webm': 'audio/webm'
};
const MIME_EXT = new Map(Object.entries(AUDIO_TYPES).map(([ext, mime]) => [mime, ext]));
MIME_EXT.set('audio/x-wav', '.wav');
MIME_EXT.set('audio/wave', '.wav');
MIME_EXT.set('audio/x-flac', '.flac');
MIME_EXT.set('audio/mp3', '.mp3');
MIME_EXT.set('audio/x-m4a', '.m4a');

export function audioExtension(contentType, filename = '') {
  const mime = String(contentType || '').split(';')[0].trim().toLowerCase();
  return MIME_EXT.get(mime) || (mime === 'application/octet-stream' && AUDIO_TYPES[extname(String(filename)).toLowerCase()]
    ? extname(String(filename)).toLowerCase() : null);
}

export function hasAudioSignature(header, ext) {
  if (!Buffer.isBuffer(header) || header.length < 4) return false;
  if (ext === '.mp3') return header.subarray(0, 3).toString() === 'ID3' || (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
  if (ext === '.wav') return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WAVE';
  if (ext === '.flac') return header.subarray(0, 4).toString() === 'fLaC';
  if (ext === '.ogg' || ext === '.opus') return header.subarray(0, 4).toString() === 'OggS';
  if (ext === '.m4a' || ext === '.mp4') return header.subarray(4, 8).toString() === 'ftyp';
  if (ext === '.aac') return header[0] === 0xff && (header[1] & 0xf6) === 0xf0;
  if (ext === '.webm') return header.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  return false;
}

export async function storeAudio(request, mediaDirectory) {
  const ext = audioExtension(request.headers['content-type'], request.headers['x-audio-filename']);
  if (!ext) throw Object.assign(new Error('Unsupported audio format. Use MP3, M4A, AAC, WAV, FLAC, OGG or WebM.'), { status: 415 });
  const declaredSize = Number(request.headers['content-length'] || 0);
  if (declaredSize > MAX_AUDIO_BYTES) throw Object.assign(new Error('Audio file exceeds the 30 MB limit.'), { status: 413 });

  const directory = join(resolve(mediaDirectory), 'uploads');
  await mkdir(directory, { recursive: true });
  const filename = randomUUID() + ext;
  const file = join(directory, filename);
  const relativePath = 'uploads/' + filename;
  let size = 0;
  let header = Buffer.alloc(0);

  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      if (size > MAX_AUDIO_BYTES) return callback(Object.assign(new Error('Audio file exceeds the 30 MB limit.'), { status: 413 }));
      if (header.length < 16) header = Buffer.concat([header, chunk.subarray(0, 16 - header.length)]);
      callback(null, chunk);
    },
    flush(callback) {
      if (size < 1024 || !hasAudioSignature(header, ext)) {
        return callback(Object.assign(new Error('The uploaded file does not match its audio format or is too small.'), { status: 415 }));
      }
      callback();
    }
  });

  try {
    await pipeline(request, limiter, createWriteStream(file, { flags: 'wx', mode: 0o640 }));
    return { path: relativePath, mime: AUDIO_TYPES[ext], size, file };
  } catch (error) {
    await rm(file, { force: true }).catch(() => {});
    throw error;
  }
}
