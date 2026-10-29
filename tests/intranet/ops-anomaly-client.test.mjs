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
 } });return exports;
}
const ops = load('src/lib/opsAnomalies.ts');
const corrected = { id: 'case', revision: 7, status: 'resolved', created_by: 'reporter', owner_id: 'worker', resolved_by: 'solver', archived_at: null, checks: ['Inspect','Recheck'], completed_checks: ['Inspect','Recheck'], corrective_action: 'Replace component', evidence: 'Reinspection', document_ids: [] };
test('Ops closure requires an independent validator while unverified historical resolutions can only be returned', () => {
 for (const actor of [undefined,'reporter','worker','solver']) assert.equal(ops.anomalyMayReview(corrected, actor, true), false);
 assert.equal(ops.anomalyMayReview(corrected, 'reviewer', false), false);
 assert.equal(ops.anomalyMayReview(corrected, 'reviewer', true), true);
 const unverified = { ...corrected, resolved_by: null };
 assert.equal(ops.anomalyMayReview(unverified, 'reviewer', true), false);
 assert.equal(ops.anomalyMayReview(unverified, 'reviewer', true, 'return'), true);
 assert.equal(ops.anomalyMayReview({ ...corrected, archived_at: '2026-10-29' }, 'reviewer', true), false);
});
test('dismissal is limited to active cases and does not approve a correction', () => {
 assert.equal(ops.anomalyMayReview({ ...corrected, status: 'open', resolved_by: null }, 'reviewer', true, 'dismiss'), true);
 assert.equal(ops.anomalyMayReview(corrected, 'reviewer', true, 'dismiss'), false);
 assert.equal(ops.anomalyMayReview({ ...corrected, status: 'closed' }, 'reviewer', true, 'dismiss'), false);
});
test('resolution needs corrective action, a proof and all the selected checks', () => {
 assert.equal(ops.anomalyReadyForResolution(corrected), true);
 assert.equal(ops.anomalyReadyForResolution({ ...corrected, completed_checks: ['Inspect'] }), false);
 assert.equal(ops.anomalyReadyForResolution({ ...corrected, corrective_action: '  ' }), false);
 assert.equal(ops.anomalyReadyForResolution({ ...corrected, evidence: '', document_ids: [] }), false);
 assert.equal(ops.anomalyReadyForResolution({ ...corrected, evidence: null, document_ids: ['document'] }), true);
});
test('legacy checks and display dates remain usable without fabricating missing values', () => {
 const normalized = ops.normalizeAnomaly({ ...corrected, checks: ['Inspect', null, { legacy: true }], owner_name: 'Owner' });
 assert.deepEqual(normal(normalized.checks), ['Inspect']);assert.equal(normalized.owner_name, 'Owner');
 assert.deepEqual(normal(ops.normalizeAnomaly({ checks: null }).checks), []);
 assert.equal(ops.anomalyDate('infinity'), 'Non renseignée');assert.equal(ops.anomalyDate(null), 'Non renseignée');
});
test('reminder times round-trip through local time and reject impossible calendar values', () => {
 const input = '2026-11-06T15:30';const iso = ops.parseLocalDateTime(input);
 assert.equal(ops.localDateTime(iso), input);assert.equal(ops.parseLocalDateTime(''), null);
 for (const value of ['not a date','2026-02-31T10:00','infinity']) assert.throws(() => ops.parseLocalDateTime(value), /invalide/);
});
test('overdue means an unfinished non-archived case with a real elapsed deadline', () => {
 const now = Date.parse('2026-10-29T10:00:00Z');const anomaly = { due_at: '2026-10-29T09:00:00Z', status: 'open', archived_at: null };
 assert.equal(ops.isOverdue(anomaly, now), true);
 for (const patch of [{ status: 'resolved' }, { status: 'closed' }, { archived_at: '2026-10-28' }, { due_at: null }, { due_at: 'infinity' }, { due_at: '2026-10-30T10:00:00Z' }]) assert.equal(ops.isOverdue({ ...anomaly, ...patch }, now), false);
});
function client(mode = false) {
 const calls = [], invalidated = [];const state = { fail: false };
 const hooks = load('src/hooks/useAnomalies.ts', {
  react: { useRef: value => ({ current: value }) },
  '@tanstack/react-query': { useQuery: options => options, useMutation: options => options, useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => invalidated.push(queryKey[0]) }) },
  './useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: mode } }) },
  '@/lib/intranet': { intranetRpc: async (name, args) => { calls.push({ name, args });if (state.fail) throw new Error('uncertain response');return name === 'list_ops_anomalies' ? { rows: [{ ...corrected, owner_name: 'Worker' }], has_more: true } : { id: 'case', revision: 1 }; } },
  sonner: { toast: { success() {}, error() {} } },
 });return { calls, invalidated, state, hooks, actions: hooks.useAnomalyActions() };
}
test('an uncertain Ops creation reuses its key and a confirmed creation allows a new case', async () => {
 const { calls, state, actions } = client();const input = { title: 'Ops case', team: 'Finance' };
 state.fail = true;await assert.rejects(actions.create.mutationFn(input));state.fail = false;
 await actions.create.mutationFn(input);await actions.create.mutationFn(input);
 assert.equal(calls[0].args.p_key, calls[1].args.p_key);assert.notEqual(calls[1].args.p_key, calls[2].args.p_key);
 assert.equal(calls[1].args.p_payload.team, 'Finance');
});
test('edits and decisions carry the original revision to separate server operations', async () => {
 const { calls, actions, invalidated } = client();
 await actions.update.mutationFn({ id: 'case', revision: 7, patch: { evidence: 'Photos reviewed' } });
 await actions.transition.mutationFn({ anomaly: corrected, action: 'approve', note: 'Independent verification' });
 assert.deepEqual(normal(calls), [
  { name: 'update_ops_anomaly', args: { p_id: 'case', p_revision: 7, p_patch: { evidence: 'Photos reviewed' } } },
  { name: 'transition_ops_anomaly', args: { p_id: 'case', p_revision: 7, p_action: 'approve', p_note: 'Independent verification' } },
 ]);
 actions.transition.onSuccess();for (const key of ['ops-anomaly','anomalies','ops-anomaly-stats','anomaly-events','anomaly-notifications','direction-ops','notifications','drive-documents']) assert.ok(invalidated.includes(key));
});
test('list filters and journal offsets go to the server, with separate real and test caches', async () => {
 const real = client(), synthetic = client(true);const filters = { search: 'Seal', status: 'active', source: 'audits', team: 'Qualité', view: 'mine', offset: 50 };
 const result = await real.hooks.useAnomalies(filters).queryFn();assert.equal(result.rows[0].owner_name, 'Worker');
 assert.deepEqual(normal(real.calls[0]), { name: 'list_ops_anomalies', args: { p_search: 'Seal', p_status: 'active', p_source: 'audits', p_team: 'Qualité', p_view: 'mine', p_offset: 50 } });
 await real.hooks.useAnomalyEvents('case', 100).queryFn();await real.hooks.useAnomalyNotifications(null, 50).queryFn();
 assert.equal(real.calls[1].args.p_offset, 100);assert.equal(real.calls[2].args.p_offset, 50);
 assert.notDeepEqual(normal(real.hooks.useAnomalyStats().queryKey), normal(synthetic.hooks.useAnomalyStats().queryKey));
});
function form(pending = false) {
 const submitted = [], closed = [], agent = '10000000-0000-4000-8000-000000000002';
 const mocks = { react: { useState: value => [value, () => {}] },
  '@/hooks/useAnomalies': { useAssignees: () => ({ data: [{ id: agent, name: 'Agent réel' }] }) },
  '@/components/operations/RecordAttachments': { default: 'RecordAttachments' }, sonner: { toast: { error(message) { throw new Error(message); } } },
 };
 for (const [file, names] of Object.entries({ button: ['Button'], input: ['Input'], label: ['Label'], textarea: ['Textarea'], dialog: ['Dialog','DialogContent','DialogHeader','DialogTitle','DialogDescription'], select: ['Select','SelectContent','SelectItem','SelectTrigger','SelectValue'] })) mocks['@/components/ui/' + file] = Object.fromEntries(names.map(name => [name, name]));
 const Form = load('src/components/forms/AnomalyEditor.tsx', mocks).default;
 const original = { ...corrected, owner_id: agent, title: ' Finding ', type: ' Damage ', source: 'logistics', team: 'Finance', severity: 'high', due_at: '2026-11-06T15:30:29.251Z', reminder_at: null };
 const tree = Form({ original, pending, close: () => closed.push(true), save: fields => submitted.push(fields) });
 const nodes = [];function visit(node) { if (Array.isArray(node)) return node.forEach(visit);if (!node || typeof node !== 'object') return;if (node.type) nodes.push(node);visit(node.props?.children); }visit(tree);
 return { nodes, submitted, closed, original, agent };
}
test('Ops forms persist the team and a real owner, preserving unchanged deadline precision', () => {
 const { nodes, submitted, closed, original, agent } = form();nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
 assert.equal(submitted[0].team, 'Finance');assert.equal(submitted[0].owner_id, agent);assert.equal(submitted[0].title, 'Finding');assert.equal(submitted[0].type, 'Damage');
 assert.equal(submitted[0].due_at, original.due_at);assert.equal('created_by' in submitted[0], false);assert.equal('revision' in submitted[0], false);
 assert.equal(nodes.find(node => node.type === 'RecordAttachments').props.ownerOnly, true);assert.equal(closed.length, 0);
});
test('pending Ops forms block duplicate submission and premature closing', () => {
 const { nodes, submitted, closed } = form(true);nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });nodes.find(node => node.type === 'Dialog').props.onOpenChange(false);
 assert.equal(submitted.length, 0);assert.equal(closed.length, 0);assert.equal(nodes.find(node => node.type === 'fieldset').props.disabled, true);
});
