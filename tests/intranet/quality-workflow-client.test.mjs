import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const normal = value => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
 vm.runInNewContext(code, { exports, crypto, require: name => {
  if (name in mocks) return mocks[name];
  if (name === 'react/jsx-runtime') return require(name);
  if (name.startsWith('@/lib/')) return load('src/lib/' + name.slice(6) + '.ts', mocks);
  throw new Error('Unexpected dependency ' + name);
 } });
 return exports;
}
const quality = load('src/lib/qualityAlerts.ts');
const metrics = load('src/lib/operationsMetrics.ts');
const submitted = { status: 'resolved', approval_levels: 2, archived_at: null, reported_by: 'reporter', assigned_to: 'worker', resolved_by: 'solver', first_reviewer: null };
test('quality reviewers are distinct from the reporter, responsible agent and solver', () => {
 for (const actor of [undefined, 'reporter', 'worker', 'solver']) assert.equal(quality.qualityMayReview(submitted, actor, true), false);
 assert.equal(quality.qualityMayReview(submitted, 'reviewer', false), false);
 assert.equal(quality.qualityMayReview(submitted, 'reviewer', true), true);
 assert.equal(quality.qualityMayReview({ ...submitted, status: 'investigating' }, 'reviewer', true), false);
 assert.equal(quality.qualityMayReview({ ...submitted, archived_at: '2026-10-29' }, 'reviewer', true), false);
});
test('two-level closure requires another reviewer while the first reviewer may request rework', () => {
 const reviewed = { ...submitted, status: 'reviewed', first_reviewer: 'first' };
 assert.equal(quality.qualityMayReview(reviewed, 'first', true), false);
 assert.equal(quality.qualityMayReview(reviewed, 'first', true, 'return'), true);
 assert.equal(quality.qualityMayReview(reviewed, 'second', true), true);
 assert.equal(quality.qualityActionLabel(submitted, 'approve'), 'Première validation');
 assert.equal(quality.qualityActionLabel(reviewed, 'approve'), 'Valider et clôturer');
 assert.equal(quality.qualityActionLabel({ ...submitted, approval_levels: 1 }, 'approve'), 'Valider et clôturer');
});
test('scores use completed audits with known measurements and preserve a measured zero', () => {
 const result = metrics.auditMetrics([
  { status: 'completed', score: null }, { status: 'completed', score: 0 }, { status: 'completed', score: 80 },
  { status: 'in_progress', score: 100 }, { status: 'scheduled', score: 90 }, { status: 'completed', score: 101 },
 ]);
 assert.deepEqual(normal(result), { total: 6, completed: 4, scheduled: 1, inProgress: 1, average: 40, samples: 2 });
 assert.deepEqual(normal(metrics.measuredAverage([null, undefined, NaN, -1, 200])), { average: null, samples: 0 });
 assert.deepEqual(normal(metrics.measuredAverage([null, 0, 100])), { average: 50, samples: 2 });
});
test('all accessible pages contribute to operational totals and failed pages do not produce partial totals', async () => {
 const rows = Array.from({ length: 1001 }, (_, index) => ({ id: String(index).padStart(5, '0') })); const cursors = [];
 const fetch = cursor => { cursors.push(cursor); return Promise.resolve({ data: rows.filter(row => !cursor || row.id > cursor).slice(0, 500), error: null }); };
 assert.equal((await metrics.readAllPages(fetch)).length, 1001);
 assert.deepEqual(cursors, [undefined, '00499', '00999']);
 await assert.rejects(metrics.readAllPages(cursor => cursor ? Promise.resolve({ data: null, error: { message: 'next page failed' } }) : fetch(cursor)), /next page failed/);
});
function client(testMode = false) {
 const calls = [], invalidated = []; const state = { fail: false };
 const mocks = {
  react: { useRef: value => ({ current: value }) },
  '@tanstack/react-query': { useQuery: options => options, useMutation: options => options, useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { invalidated.push(queryKey[0]); } }) },
  '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: testMode } }) },
  './useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: testMode } }) },
  './useFieldAuditRows': { useFieldAuditRows: () => ({ data: [] }) },
  '@/integrations/supabase/client': { supabase: {} },
  '@/lib/intranet': { intranetRpc: async (name, args) => { calls.push({ name, args }); if (state.fail) throw new Error('uncertain response'); return { id: 'record', revision: 1 }; } },
  sonner: { toast: { success() {}, error() {} } },
 };
 return { calls, invalidated, state, quality: load('src/hooks/useQualityAlerts.ts', mocks), missions: load('src/hooks/useAuditMissions.ts', mocks) };
}
test('an unconfirmed quality creation retries the same key and a confirmed creation starts a new case', async () => {
 const { quality: hooks, calls, state } = client(); const actions = hooks.useQualityActions('audit.nonconformities'); const input = { title: 'Inspection finding' };
 state.fail = true; await assert.rejects(actions.create.mutationFn(input)); state.fail = false;
 await actions.create.mutationFn(input); await actions.create.mutationFn(input);
 assert.equal(calls[0].args.p_key, calls[1].args.p_key); assert.notEqual(calls[1].args.p_key, calls[2].args.p_key);
 assert.ok(calls.every(call => call.args.p_page === 'audit.nonconformities'));
});
test('quality edits and decisions carry the original revision and invalidate related evidence and dashboards', async () => {
 const { quality: hooks, calls, invalidated } = client(); const actions = hooks.useQualityActions('supplier.alerts');
 await actions.update.mutationFn({ id: 'case', revision: 7, patch: { evidence: 'Reinspection' } });
 await actions.transition.mutationFn({ alert: { id: 'case', revision: 8 }, action: 'approve', note: 'Independent check' });
 assert.deepEqual(normal(calls), [
  { name: 'update_quality_alert', args: { p_page: 'supplier.alerts', p_id: 'case', p_revision: 7, p_patch: { evidence: 'Reinspection' } } },
  { name: 'transition_quality_alert', args: { p_page: 'supplier.alerts', p_id: 'case', p_revision: 8, p_action: 'approve', p_note: 'Independent check' } },
 ]);
 actions.transition.onSuccess();
 for (const key of ['quality-alerts', 'quality-alert', 'quality-stats', 'quality-timeline', 'drive-documents', 'notifications', 'supplier_dashboard_stats']) assert.ok(invalidated.includes(key));
});
test('quality pagination and dashboard detail access are explicit and caches distinguish test data', async () => {
 const real = client(), synthetic = client(true);
 const query = real.quality.useQualityAlerts('audit.nonconformities', 'formal', 'Seal', 'active', 50);
 await query.queryFn();
 assert.deepEqual(normal(real.calls[0]), { name: 'list_quality_alerts', args: { p_page: 'audit.nonconformities', p_kind: 'formal', p_search: 'Seal', p_status: 'active', p_offset: 50 } });
 assert.equal(real.quality.useQualityAlerts('audit.nonconformities', 'formal', '', 'active', 0, false).enabled, false);
 assert.notDeepEqual(normal(real.quality.useQualityStats('audit.overview').queryKey), normal(synthetic.quality.useQualityStats('audit.overview').queryKey));
});
test('mission creation retries safely and edits carry the revision separately from the patch', async () => {
 const { missions, calls, state, invalidated } = client(); const actions = missions.useMissionActions(); const input = { target_name: 'Supplier' };
 state.fail = true; await assert.rejects(actions.create.mutationFn(input)); state.fail = false;
 await actions.create.mutationFn(input); await actions.create.mutationFn(input);
 assert.equal(calls[0].args.p_key, calls[1].args.p_key); assert.notEqual(calls[1].args.p_key, calls[2].args.p_key);
 await actions.update.mutationFn({ id: 'mission', revision: 12, workflow_status: 'non_compliant', decision_reason: 'Damaged seals' });
 assert.deepEqual(normal(calls[3]), { name: 'update_audit_mission', args: { p_id: 'mission', p_revision: 12, p_patch: { workflow_status: 'non_compliant', decision_reason: 'Damaged seals' } } });
 actions.update.onSuccess(); assert.ok(invalidated.includes('field-audit-rows')); assert.ok(invalidated.includes('audit-mission-events'));
});
function form(pending = false) {
 const submitted = [], closed = [], agent = '10000000-0000-4000-8000-000000000008';
 const mocks = { react: { useState: value => [value, () => {}] },
  '@/hooks/useQualityAlerts': { useQualityPeople: () => ({ data: [{ id: agent, name: 'Auditeur' }] }), useQualityReferences: () => ({ data: { products: [], suppliers: [] } }) },
  '@/components/operations/RecordAttachments': { default: 'RecordAttachments' },
 };
 for (const [file, names] of Object.entries({ button: ['Button'], input: ['Input'], label: ['Label'], textarea: ['Textarea'], dialog: ['Dialog', 'DialogContent', 'DialogHeader', 'DialogTitle'], select: ['Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'] })) mocks['@/components/ui/' + file] = Object.fromEntries(names.map(name => [name, name]));
 const Form = load('src/components/forms/QualityAlertEditor.tsx', mocks).default;
 const tree = Form({ page: 'audit.nonconformities', pending, original: { title: ' Finding ', description: ' Details ', assigned_to: agent, document_ids: [], is_nonconformity: true, reported_by: 'forged', revision: 20 }, close: () => closed.push(true), save: fields => submitted.push(fields) });
 const nodes = []; function visit(node) { if (Array.isArray(node)) return node.forEach(visit); if (!node || typeof node !== 'object') return; if (node.type) nodes.push(node); visit(node.props?.children); }visit(tree);
 return { nodes, submitted, closed, agent };
}
test('quality forms submit actual agent IDs and editable fields, retaining the sheet until success', () => {
 const { nodes, submitted, closed, agent } = form();
 nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
 assert.equal(submitted[0].assigned_to, agent); assert.equal(submitted[0].title, 'Finding'); assert.equal(submitted[0].description, 'Details');
 assert.equal('revision' in submitted[0], false); assert.equal('reported_by' in submitted[0], false); assert.equal(closed.length, 0);
 assert.equal(nodes.find(node => node.type === 'RecordAttachments').props.ownerOnly, true);
});
test('pending quality forms lock attachments and prevent premature closing', () => {
 const { nodes, closed } = form(true); nodes.find(node => node.type === 'Dialog').props.onOpenChange(false);
 assert.equal(closed.length, 0); assert.equal(nodes.find(node => node.type === 'fieldset').props.disabled, true);
 assert.equal(nodes.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
});
