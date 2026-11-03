import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('intranet pages are route-split and render within a suspense boundary', () => {
  const app = read('src/App.tsx');
  const lazyImports = [...app.matchAll(/const \w+ = lazy\(\(\) => import\(/g)];
  assert.ok(lazyImports.length >= 170, 'Most role modules must be loaded on demand');
  assert.match(app, /<Suspense fallback=/);
  assert.doesNotMatch(app, /^import \w+ from ["']\.\/pages\/modules\//m);
});

test('intranet sessions survive a page refresh and browser cleanup', () => {
  const auth = read('src/integrations/supabase/client.ts');
  const cleanup = read('src/lib/purgeLegacyBrowserRecords.ts');
  assert.match(auth, /persistSession: true/);
  assert.doesNotMatch(auth, /storage: memoryAuthStorage/);
  assert.match(cleanup, /migrationMarker = "bib:legacy-browser-cleanup:v2"/);
  assert.ok(cleanup.includes('!/^sb-[a-z0-9-]+-auth-token$/i.test(key)'));
});
