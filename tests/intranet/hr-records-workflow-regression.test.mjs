import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('all HR record pages use a stable, account-separated full list', () => {
 const file = read('src/components/rh/HrRecordsPage.tsx');
 assert.match(file, /readAllPages<\{ id: string;/);
 assert.match(file, /if \(cursor\) query = query\.gt\('id', cursor\)/);
 assert.match(file, /user\?\.id, profile\?\.test_account === true, config\.table/);
 assert.match(file, /enabled: !!user && !!profile && !hrLoading && !hrError/);
 assert.match(file, /if \(error\) throw error;/);
});
test('create and workflow transitions fail closed for incomplete permissions and invalid states', () => {
 const file = read('src/components/rh/HrRecordsPage.tsx');
 assert.match(file, /!user\?\.id \|\| hrLoading \|\| hrError/);
 assert.match(file, /!config\.transitions\?\.\[current\.status\]\?\.includes\(next\)/);
 assert.match(file, /records\.isError \|\| records\.isLoading/);
});
test('leave and training date periods reject inverted bounds', () => {
 assert.match(read('src/pages/modules/rh/Leave.tsx'), /dateRange: \{ start: 'start_date', end: 'end_date' \}/);
 assert.match(read('src/pages/modules/rh/Training.tsx'), /dateRange: \{ start: 'start_date', end: 'due_date' \}/);
 assert.match(read('src/components/rh/HrRecordsPage.tsx'), /payload\[config\.dateRange\.end\] < payload\[config\.dateRange\.start\]/);
});
