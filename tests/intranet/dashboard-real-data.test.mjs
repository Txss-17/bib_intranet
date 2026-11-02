import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = path => readFileSync(new URL('../../' + path, import.meta.url),'utf8');

test('department overview does not generate task, incident, or update statistics', () => {
  const source = file('src/components/dashboard/PoleOverview.tsx');
  assert.doesNotMatch(source, /const poleActivity|Données d'activité de démonstration/);
});
test('dashboard shows real authorized work and hides inaccessible shortcuts', () => {
  const dashboard = file('src/pages/Dashboard.tsx');
  const tasks = file('src/components/dashboard/WorkTasksOverview.tsx');
  const shortcuts = file('src/components/dashboard/QuickActions.tsx');
  assert.match(dashboard,/WorkTasksOverview/);
  assert.match(tasks,/useWorkTasks\(\)/);
  assert.match(tasks,/canViewPath\('\/work\/tasks'\)/);
  assert.match(tasks,/Aucune tâche en cours ou à venir/);
  assert.match(shortcuts,/quickActions\.filter\(\(action\) => canViewPath/);
});
test('no fake sandbox datasets or local permission records remain active', () => {
  const sandbox = file('src/hooks/useSandbox.tsx');
  const perm = file('src/data/permissionMatrix.ts');
  assert.doesNotMatch(sandbox, /generateSpaceDatasets|localStorage/);
  assert.doesNotMatch(perm, /localStorage\./);
  assert.match(file('src/integrations/supabase/client.ts'),/storage: memoryAuthStorage/);
});
