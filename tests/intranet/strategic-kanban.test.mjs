import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('strategic roadmap uses editable Kanban and per-objective priorities', () => {
  const ui = read('src/pages/modules/direction/VisionRoadmap.tsx');
  const hook = read('src/hooks/useDirectionContent.ts');
  assert.match(ui, /<TabsTrigger value="kanban">/);
  assert.match(ui, /onDragStart=\{\(\) => setDragId\(item\.id\)\}/);
  assert.match(ui, /moveMilestone\(column\)/);
  assert.match(ui, /OBJECTIVE_PRIORITIES/);
  assert.match(hook, /priority: objective\.priority \?\? 'medium'/);
  assert.match(ui, /janvier 2027 – septembre 2028/);
  assert.match(ui, /à valider par la Direction/);
});

test('project Kanban persists authorized transitions and stores validated priority', () => {
  const ui = read('src/components/operations/WorkModulePage.tsx');
  const hook = read('src/hooks/useWorkModule.ts');
  const sql = read('drizzle/migrations/0082_work_project_priority.sql');
  assert.match(ui, /projectLayout.*'kanban'/);
  assert.match(ui, /onDrop=\{event =>/);
  assert.match(ui, /moveProject\(item, column\)/);
  assert.match(ui, /actions\.update\.mutate\(\{ id: r\.id, revision: r\.revision, status: next, change_note: reason \}\)/);
  assert.match(ui, /input\.priority = form\.priority/);
  assert.match(hook, /PROJECT_PRIORITY_LABELS/);
  assert.match(sql, /CHECK \(priority IN \('low','medium','high','critical'\)\)/);
  assert.match(sql, /'due_date','priority'/);
});
