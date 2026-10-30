import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('Data home differentiates Data Analyst and Data Engineer', () => {
  const page = read('src/pages/modules/data/DataDashboard.tsx');
  for (const keyword of ['Espace Data Analyst','Espace Data Engineer','Qualité & gouvernance','Cartographier les sources','Analyser et visualiser']) {
    assert.ok(page.includes(keyword), keyword);
  }
  assert.match(page, /<Tabs defaultValue="analyst"/);
  assert.match(page, /useDataSources/);
  assert.match(page, /Non mesurées/);
  assert.match(page, /Non confirmés/);
});

test('Data BI sources do not represent connection health without evidence', () => {
  const page = read('src/pages/modules/data/bi/BIDataSources.tsx');
  assert.match(page, /isError/);
  assert.match(page, /catalogue indique une source configurée/);
  assert.match(page, /onClick=\{\(\) => void refetch\(\)\}/);
});
