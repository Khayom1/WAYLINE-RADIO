import net from 'node:net';

export function canBroadcastTrack(track, now = new Date()) {
  if (!track || track.is_active === false) return { allowed: false, reason: 'Track is inactive.' };
  if (track.license_verified !== true) return { allowed: false, reason: 'License has not been verified.' };
  if (track.commercial_allowed !== true) return { allowed: false, reason: 'Commercial broadcast rights are not confirmed.' };
  if (track.streaming_allowed !== true) return { allowed: false, reason: 'Internet streaming rights are not confirmed.' };
  if (!track.license_type || !String(track.license_type).trim()) return { allowed: false, reason: 'License type is missing.' };
  if (!track.license_proof_url || !/^https?:\/\//i.test(track.license_proof_url)) return { allowed: false, reason: 'A license proof URL is missing.' };
  if (!track.rights_holder || !String(track.rights_holder).trim()) return { allowed: false, reason: 'Rights holder is missing.' };
  if (!track.audio_url || !/^https?:\/\//i.test(track.audio_url)) return { allowed: false, reason: 'A valid audio URL is required.' };
  if (track.license_expires_at) {
    const expiry = new Date(track.license_expires_at);
    if (!Number.isFinite(expiry.getTime()) || expiry < now) return { allowed: false, reason: 'License is expired or has an invalid date.' };
  }
  return { allowed: true, reason: 'Rights metadata passed the configured checks. Human review of the proof is still required.' };
}

function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 ||
    (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) ||
    (p[0] === 192 && p[1] === 168) ||
    (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}

export function validateFeedUrl(value) {
  let url;
  try { url = new URL(value); } catch { return { valid: false, reason: 'Invalid URL.' }; }
  if (url.protocol !== 'https:') return { valid: false, reason: 'Only HTTPS feeds are accepted.' };
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    return { valid: false, reason: 'Local and private hosts are not allowed.' };
  }
  const ipType = net.isIP(host);
  if (ipType === 4 && isPrivateIPv4(host)) return { valid: false, reason: 'Private IP addresses are not allowed.' };
  if (ipType === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80'))) {
    return { valid: false, reason: 'Private IP addresses are not allowed.' };
  }
  url.username = '';
  url.password = '';
  return { valid: true, url: url.toString() };
}
