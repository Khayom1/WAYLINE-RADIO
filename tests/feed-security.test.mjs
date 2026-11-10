import test from 'node:test';
import assert from 'node:assert/strict';
import { createPinnedLookup } from '../apps/worker/src/feed-security.js';

test('feed DNS resolver rejects loopback, private, reserved and mixed public/private DNS answers', async () => {
  for (const address of ['127.0.0.1', '10.0.0.4', '172.18.0.1', '192.168.1.1',
    '169.254.1.1', '100.64.0.1', '198.18.0.1', '224.0.0.1', '::1',
    'fd00::1', 'fe80::1', '::ffff:127.0.0.1', '2001:db8::1']) {
    await assert.rejects(
      createPinnedLookup('feed.example', async () => [{ address, family: address.includes(':') ? 6 : 4 }]),
      /private or reserved/
    );
  }
  await assert.rejects(
    createPinnedLookup('feed.example', async () => [
      { address: '8.8.8.8', family: 4 },
      { address: '127.0.0.1', family: 4 }
    ]),
    /private or reserved/
  );
});

test('pinned DNS callback returns only the previously validated public addresses', async () => {
  let queried = '';
  const resolver = async (host, options) => {
    queried = host;
    assert.equal(options.all, true);
    assert.equal(options.verbatim, true);
    return [
      { address: '8.8.8.8', family: 4 },
      { address: '2606:4700:4700::1111', family: 6 }
    ];
  };
  const pinned = await createPinnedLookup('feeds.example', resolver);
  assert.equal(queried, 'feeds.example');

  const ipv4 = await new Promise((resolve, reject) => {
    pinned('feeds.example', { family: 4 }, (error, address, family) => error ? reject(error) : resolve({ address, family }));
  });
  assert.deepEqual(ipv4, { address: '8.8.8.8', family: 4 });

  const all = await new Promise((resolve, reject) => {
    pinned('feeds.example', { all: true }, (error, records) => error ? reject(error) : resolve(records));
  });
  assert.deepEqual(all, [
    { address: '8.8.8.8', family: 4 },
    { address: '2606:4700:4700::1111', family: 6 }
  ]);
});

test('IPv4 and IPv6 literal hosts are pinned without performing another DNS lookup', async () => {
  const resolver = async () => { throw new Error('DNS lookup must not run for IP literals'); };
  const ipv4 = await createPinnedLookup('8.8.8.8', resolver);
  const answer = await new Promise((resolve, reject) => {
    ipv4('8.8.8.8', { family: 4 }, (error, address, family) => error ? reject(error) : resolve({ address, family }));
  });
  assert.deepEqual(answer, { address: '8.8.8.8', family: 4 });

  await assert.rejects(createPinnedLookup('192.168.1.10', resolver), /private or reserved/);
});
