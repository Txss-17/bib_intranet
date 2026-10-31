import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
test('mission decisions fail closed for outdated revisions and unknown transitions', () => {
 const page = read('src/pages/modules/audit/AuditMissions.tsx');
 assert.match(page, /const staleDraft = !!sel && draftRevision !== null && draftRevision !== sel.revision/);
 assert.match(page, /update\.isPending \|\| staleDraft \|\| needsReason/);
 assert.match(page, /update\.isPending \|\| staleDraft \|\| !results/);
 assert.match(page, /update\.isPending \|\| staleDraft \|\| proof == null/);
 assert.match(page, /MISSION_TRANSITIONS\[sel\.workflow_status\] \?\? \[\]/);
});
test('quality decisions reject stale revisions and repeated pending requests', () => {
 const page = read('src/components/operations/QualityWorkspace.tsx');
 assert.match(page, /const staleDecision = !!selected && decisionRevision !== null && decisionRevision !== selected.revision/);
 assert.match(page, /actions\.transition\.isPending \|\| staleDecision/);
 assert.match(page, /revision: decisionRevision \?\? selected.revision/);
});
