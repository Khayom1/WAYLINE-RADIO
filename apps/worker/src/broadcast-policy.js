import { relative, resolve, sep } from 'node:path';

export function managedAudioPath(value, root) {
  if (typeof value !== 'string' || !/^uploads\/[a-f0-9-]{36}\.(mp3|m4a|mp4|aac|wav|flac|ogg|opus|webm)$/i.test(value)) return null;
  const base = resolve(root);
  const target = resolve(base, value);
  if (!target.startsWith(base + sep) || !relative(base, target).startsWith('uploads' + sep)) return null;
  return target;
}

export function ffconcatFile(paths) {
  return paths.map(path => "file '" + path.replace(/\\/g, '\\\\').replace(/'/g, "'\\''") + "'").join('\n') + '\n';
}

export function safeMount(value) {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/i.test(value);
}
