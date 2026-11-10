import test from 'node:test';
import assert from 'node:assert/strict';
import { canBroadcastTrack, validateFeedUrl } from '../apps/api/src/policy.js';

const eligible={is_active:true,license_verified:true,commercial_allowed:true,streaming_allowed:true,license_type:'CC BY 4.0',audio_url:'https://cdn.example.org/song.mp3',license_proof_url:'https://licenses.example.org/proof',rights_holder:'Test Label'};
test('track is eligible only when every rights condition is explicit',()=>{assert.equal(canBroadcastTrack(eligible).allowed,true);});
test('unverified, non-commercial, non-streaming and expired tracks are blocked',()=>{
  for(const patch of [{license_verified:false},{commercial_allowed:false},{streaming_allowed:false},{license_expires_at:'2000-01-01'}])assert.equal(canBroadcastTrack({...eligible,...patch}).allowed,false);
});
test('RSS feed URLs must use HTTPS and public hosts',()=>{
  assert.equal(validateFeedUrl('https://feeds.example.org/rss.xml').valid,true);
  assert.equal(validateFeedUrl('http://feeds.example.org/rss.xml').valid,false);
  assert.equal(validateFeedUrl('https://127.0.0.1/feed').valid,false);
  assert.equal(validateFeedUrl('https://localhost/feed').valid,false);
});
test('feed validation blocks private IPv6 and mapped loopback addresses',()=>{
  assert.equal(validateFeedUrl('https://[::1]/feed').valid,false);
  assert.equal(validateFeedUrl('https://[fd00::1]/feed').valid,false);
  assert.equal(validateFeedUrl('https://[fe80::1]/feed').valid,false);
  assert.equal(validateFeedUrl('https://[::ffff:127.0.0.1]/feed').valid,false);
});
test('feed validation rejects local suffixes and strips embedded credentials',()=>{
  assert.equal(validateFeedUrl('https://router.local/feed').valid,false);
  assert.equal(validateFeedUrl('https://server.localhost/feed').valid,false);
  const safe=validateFeedUrl('https://user:secret@feeds.example.org/rss');
  assert.equal(safe.valid,true);
  assert.equal(new URL(safe.url).username,'');
  assert.equal(new URL(safe.url).password,'');
});

test('license expiry date remains valid through the stated calendar day',()=>{
  const now=new Date('2026-11-10T18:30:00.000Z');
  assert.equal(canBroadcastTrack({...eligible,license_expires_at:'2026-11-10'},now).allowed,true);
  assert.equal(canBroadcastTrack({...eligible,license_expires_at:'2026-11-09'},now).allowed,false);
  assert.equal(canBroadcastTrack({...eligible,license_expires_at:'2026-02-30'},now).allowed,false);
});
