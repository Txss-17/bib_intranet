import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('support account data are not exported or shown on query failure', () => {
 const file = read('src/pages/modules/support/UserAccounts.tsx');
 assert.match(file, /!isError && !isLoading && <ExportButtons/);
 assert.match(file, /!isError && accounts\?\.map/);
 assert.match(file, /statsError \? '—'/);
});
test('support activity caches are user isolated, with sample-size disclosure', () => {
 const file = read('src/pages/modules/support/SupportMonitoring.tsx');
 assert.match(file, /profile\?\.test_account === true/);
 assert.match(file, /enabled: !!user && !!profile/);
 assert.match(file, /20 comptes et aux 15 événements/);
});
test('ticket table hides stale records after failed query', () => {
 const file = read('src/pages/modules/support/SupportTickets.tsx');
 assert.match(file, /!query\.isError && !query\.isLoading && <ul/);
});
