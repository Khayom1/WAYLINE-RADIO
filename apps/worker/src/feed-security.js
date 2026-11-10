import { lookup } from 'node:dns/promises';
import net from 'node:net';

function privateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(value => !Number.isInteger(value) || value < 0 || value > 255)) return true;
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || parts[0] >= 224 ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && ((parts[1] === 0 && (parts[2] === 0 || parts[2] === 2)) || (parts[1] === 2 && parts[2] === 0) || parts[1] === 168)) ||
    (parts[0] === 198 && ((parts[1] === 18 || parts[1] === 19) || (parts[1] === 51 && parts[2] === 100))) ||
    (parts[0] === 203 && parts[1] === 0 && parts[2] === 113);
}

function privateIPv6(ip) {
  const host = ip.toLowerCase();
  if (host.startsWith('::ffff:')) return true;
  const first = Number.parseInt(host.split(':')[0] || '0', 16);
  return first < 0x2000 || first > 0x3fff ||
    host.startsWith('2001:db8:') || host.startsWith('2001:10:') || host.startsWith('2001:20:');
}

function blockedAddress(ip) {
  return net.isIPv4(ip) ? privateIPv4(ip) : net.isIPv6(ip) ? privateIPv6(ip) : true;
}

export async function createPinnedLookup(host, resolver = lookup) {
  const normalized = String(host || '').toLowerCase().replace(/^\[|\]$/g, '');
  const ipType = net.isIP(normalized);
  const records = ipType
    ? [{ address: normalized, family: ipType }]
    : await resolver(normalized, { all: true, verbatim: true });

  if (!Array.isArray(records) || !records.length || records.some(record => blockedAddress(record.address))) {
    throw new Error('Feed host resolves to a private or reserved address');
  }

  return (hostname, options, callback) => {
    const family = typeof options === 'number' ? options : options?.family;
    const candidates = family ? records.filter(record => record.family === family) : records;
    if (options?.all) return callback(null, candidates);
    if (!candidates.length) return callback(new Error('No approved address for feed host'));
    callback(null, candidates[0].address, candidates[0].family);
  };
}
