import { lookup } from 'node:dns/promises';
import https from 'node:https';
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


export async function downloadPinnedHttps(value, options = {}) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
    throw new Error('Only credential-free HTTPS feed URLs are allowed.');
  }
  const maxBytes = Number.isFinite(options.maxBytes) ? Math.max(1, options.maxBytes) : 1_500_000;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1000, options.timeoutMs) : 12_000;
  const lookupFunction = options.lookup || lookup;
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const pinnedLookup = await createPinnedLookup(hostname, lookupFunction);

  return new Promise((resolveResponse, rejectResponse) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (error) rejectResponse(error);
      else resolveResponse(value);
    };

    const request = https.get(url, {
      lookup: pinnedLookup,
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'user-agent': 'WAYLINE-RADIO-Collector/1.0',
        'accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        'accept-encoding': 'identity'
      }
    }, response => {
      const status = Number(response.statusCode || 0);
      if (status < 200 || status >= 300) {
        response.resume();
        finish(new Error('Feed returned HTTP ' + status));
        return;
      }

      const encoding = String(response.headers['content-encoding'] || 'identity').toLowerCase();
      if (encoding !== 'identity') {
        response.destroy();
        finish(new Error('Compressed feed responses are not accepted.'));
        return;
      }

      const declared = Number(response.headers['content-length'] || 0);
      if (declared > maxBytes) {
        response.destroy();
        finish(new Error('Feed exceeds ' + maxBytes + ' bytes.'));
        return;
      }

      const chunks = [];
      let total = 0;
      response.on('data', chunk => {
        total += chunk.length;
        if (total > maxBytes) {
          response.destroy();
          finish(new Error('Feed exceeds ' + maxBytes + ' bytes.'));
          return;
        }
        chunks.push(chunk);
      });
      response.once('end', () => finish(null, Buffer.concat(chunks, total)));
      response.once('error', error => finish(error));
    });

    request.setTimeout(timeoutMs, () => request.destroy(new Error('Feed request timed out.')));
    request.once('error', error => finish(error));
  });
}
