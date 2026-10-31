import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('campaigns and attachments paginate and isolate account caches', () => {
 for (const file of ['src/hooks/useCampaigns.ts','src/hooks/useMediaAttachments.ts']) {
  const code = read(file);
  assert.match(code, /readAllPages/);
  assert.match(code, /query\.gt\('id', cursor\)/);
  assert.match(code, /profile\?\.test_account === true/);
  assert.match(code, /enabled: !!user && !!profile/);
 }
});
test('analytics and podcasts access source validation records', () => {
 const code = read('src/components/marketing/MarketingEvidencePage.tsx');
 assert.match(code, /useIntranetRecords\(d\.id, search, 'all', offset, allowed\)/);
 assert.match(code, /next\.set\('record', id\)/);
 assert.match(code, /setTab\('records'\)/);
});
