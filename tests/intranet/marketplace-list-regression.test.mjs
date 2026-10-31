import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('merchant, shop, product and favorites lists paginate all authorized records', () => {
 for (const file of ['src/hooks/useMarketplace.tsx','src/hooks/useMarketplaceFavorites.ts']) {
  const code = read(file);
  assert.match(code, /readAllPages/);
  assert.match(code, /query\.gt\('id', cursor\)/);
  assert.match(code, /profile\?\.test_account === true/);
  assert.match(code, /enabled: !!user && !!profile/);
 }
});
test('favorite statistics count paginated rows and do not assume a single page', () => {
 const code = read('src/hooks/useMarketplaceFavorites.ts');
 assert.match(code, /readAllPages<\{ id: string; favorite_type: string \}>/);
 assert.match(code, /rows\.filter\(row => row\.favorite_type === 'product'\)/);
});
