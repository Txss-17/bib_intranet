import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../src/pages/modules/direction/VisionRoadmap.tsx', import.meta.url), 'utf8');

test('strategic priorities are a derived view of roadmap objectives', () => {
  assert.match(source, /const milestones = items\.filter\(\(i\) => i\.kind === 'milestone'\)/);
  assert.match(source, /const priorities = milestones\.flatMap/);
  assert.match(source, /milestone\.objectives\.filter/);
  assert.match(source, /Modifier dans la Roadmap/);
  assert.doesNotMatch(source, /setDraft\(newDraft\('priority'\)\)/);
  assert.doesNotMatch(source, /kind: 'milestone' \| 'priority'/);
  assert.match(source, /onClick=\{\(\) => setDraft\(toDraft\(p\.milestone\)\)\}/);
});
