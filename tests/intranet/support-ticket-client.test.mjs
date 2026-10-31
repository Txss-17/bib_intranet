import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const normal = value => JSON.parse(JSON.stringify(value));
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(read(file), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, crypto, require: name => {
    if (name in mocks) return mocks[name];
    if (name === 'react/jsx-runtime') return require(name);
    if (name.startsWith('@/lib/')) return load('src/lib/' + name.slice(6) + '.ts', mocks);
    throw new Error('Unexpected dependency ' + name);
  } });
  return exports;
}
const support = load('src/lib/supportTickets.ts');
const success = load('src/lib/customerSuccess.ts');

test('a transition carries a resolution or reopen reason without accepting invalid state jumps', () => {
  assert.deepEqual(normal(support.supportTransitionPatch('in_progress', 'resolved', ' Checked parcel ')),
    { status: 'resolved', change_note: 'Checked parcel', resolution: 'Checked parcel' });
  assert.throws(() => support.supportTransitionPatch('open', 'closed', 'Skip handling'));
  assert.throws(() => support.supportTransitionPatch('closed', 'open', '  '));
  assert.throws(() => support.supportTransitionPatch('pending', 'resolved', ''));
  assert.deepEqual(normal(support.supportTransitionPatch('closed', 'open', 'Issue recurred')),
    { status: 'open', change_note: 'Issue recurred' });
});
test('unknown resolution durations remain unknown while a measured short duration is displayed', () => {
  for (const value of [null, undefined, NaN, -1]) assert.equal(support.resolutionDuration(value), '—');
  assert.equal(support.resolutionDuration(0), 'Moins de 1 min');
  assert.equal(support.resolutionDuration(0.5), '30 min');
  assert.equal(support.resolutionDuration(2.25), '2 h 15 min');
});
test('customer success distinguishes active accounts, missing ratings and payment delays without inventing MRR', () => {
  const result = success.customerSuccessStats([
    { id: 'a', company_name: 'A', subscription_status: 'active', risk_level: 'low', payment_status: 'ok', trustpilot_rating: null, revenue: 12000 },
    { id: 'b', company_name: 'B', subscription_status: 'paused', risk_level: 'high', payment_status: 'late', trustpilot_rating: 4 },
    { id: 'c', company_name: 'C', subscription_status: 'active', risk_level: 'low', payment_status: 'critical', trustpilot_rating: 0 },
  ]);
  assert.deepEqual(normal(result), { totalUsers: 3, activeUsers: 2, atRiskUsers: 1, unpaidUsers: 2, averageRating: 4 });
  assert.equal('mrr' in result, false); assert.equal('totalRevenue' in result, false);
  assert.equal(success.customerSuccessStats([]).averageRating, null);
});

function client() {
  const calls = { rpc: [], invalidated: [] };
  const state = { uncertain: false };
  const hooks = load('src/hooks/useSupportTickets.ts', {
    '@tanstack/react-query': { useQuery: options => options, useMutation: options => options,
      useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { calls.invalidated.push(queryKey[0]); } }) },
    react: { useRef: value => ({ current: value }) },
    '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: false } }) },
    '@/integrations/supabase/client': { supabase: {} },
    '@/lib/intranet': { intranetRpc: async (name, args) => {
      calls.rpc.push({ name, args }); if (state.uncertain) throw new Error('network interrupted'); return { id: 'ticket', revision: 1 };
    } },
    sonner: { toast: { success() {}, error() {} } },
  });
  return { actions: hooks.useSupportActions(), hooks, calls, state };
}
test('an unconfirmed Support creation reuses its key; a confirmed creation permits the next case', async () => {
  const { actions, calls, state } = client(); const input = { subject: 'Parcel', description: 'Locate parcel' };
  state.uncertain = true; await assert.rejects(actions.create.mutationFn(input));
  state.uncertain = false; await actions.create.mutationFn(input);
  assert.equal(calls.rpc[0].args.p_key, calls.rpc[1].args.p_key);
  await actions.create.mutationFn(input);
  assert.notEqual(calls.rpc[1].args.p_key, calls.rpc[2].args.p_key);
});
test('support edits and archives carry the original revision to their dedicated server workflow', async () => {
  const { actions, calls } = client();
  await actions.update.mutationFn({ id: 'ticket', revision: 8, patch: { assigned_to: 'agent' } });
  await actions.archive.mutationFn({ id: 'ticket', revision: 9 });
  assert.deepEqual(normal(calls.rpc), [
    { name: 'update_support_ticket', args: { p_id: 'ticket', p_revision: 8, p_patch: { assigned_to: 'agent' } } },
    { name: 'archive_support_ticket', args: { p_id: 'ticket', p_revision: 9 } },
  ]);
  actions.update.onSuccess();
  for (const key of ['support-tickets', 'support-ticket-stats', 'support-history', 'support-notes', 'notifications']) assert.ok(calls.invalidated.includes(key));
});

const agent = '10000000-0000-4000-8000-000000000002';
function form(pending = false) {
  const submitted = [], closed = [];
  const ui = name => name;
  const mocks = {
    react: { useState: value => [value, () => {}] },
    '@/hooks/useSupportTickets': { useSupportAssignees: () => ({ data: [{ id: agent, name: 'Agent réel' }] }) },
    '@/hooks/usePoleCollaborators': { usePoleCollaborators: () => ({ data: [{ id: agent, first_name: 'Agent', last_name: 'réel', eligible: true }], isLoading: false, isError: false }), collaboratorName: p => p.first_name + ' ' + p.last_name },
    '@/hooks/useLifecycle': { useUserAccounts: () => ({ data: [] }) },
  };
  for (const [file, names] of Object.entries({
    dialog: ['Dialog', 'DialogContent', 'DialogDescription', 'DialogFooter', 'DialogHeader', 'DialogTitle'],
    button: ['Button'], input: ['Input'], label: ['Label'], textarea: ['Textarea'],
    select: ['Select', 'SelectContent', 'SelectItem', 'SelectTrigger', 'SelectValue'],
  })) mocks['@/components/ui/' + file] = Object.fromEntries(names.map(name => [name, ui(name)]));
  const Form = load('src/components/forms/SupportTicketForm.tsx', mocks).default;
  const tree = Form({ open: true, pending, ticket: { id: 'ticket', subject: ' Subject ', description: ' Description ',
    priority: 'medium', category: 'general', assigned_to: agent, user_account_id: null, created_by: 'forged', revision: 8 },
    onSubmit: value => submitted.push(value), onOpenChange: value => closed.push(value) });
  const nodes = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object') return;
    if (node.type) nodes.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return { nodes, submitted, closed };
}
test('the Support form selects a real agent UUID and stays open until its parent confirms success', () => {
  const { nodes, submitted, closed } = form();
  nodes.find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
  assert.equal(submitted.length, 1); assert.equal(submitted[0].assigned_to, agent);
  assert.equal(submitted[0].subject, 'Subject'); assert.equal(submitted[0].description, 'Description');
  assert.equal('created_by' in submitted[0], false); assert.equal('revision' in submitted[0], false);
  assert.equal(closed.length, 0);
  assert.ok(nodes.some(node => node.type === 'SelectItem' && node.props.value === agent && node.props.children === 'Agent réel'));
  assert.equal(nodes.some(node => node.type === 'Input' && node.props.value === agent), false);
});
test('pending Support writes disable submission and prevent dismissing the form', () => {
  const { nodes, closed } = form(true);
  assert.equal(nodes.find(node => node.type === 'Button' && node.props.type === 'submit').props.disabled, true);
  nodes.find(node => node.type === 'Dialog').props.onOpenChange(false);
  assert.equal(closed.length, 0);
});

function pagedQueries(failAfterFirst = false) {
  const rows = Array.from({ length: 1001 }, (_, index) => ({
    id: String(index).padStart(5, '0'), subject: 'Case ' + index, description: 'Description', status: 'open',
    created_at: new Date(Date.UTC(2026, 0, 1) + index * 1000).toISOString(), archived_at: index === 1000 ? '2026-10-01' : null,
    company_name: 'Company ' + index, subscription_status: index === 1000 ? 'paused' : 'active',
    risk_level: index === 1000 ? 'high' : 'low', payment_status: index === 1000 ? 'overdue' : 'ok',
    trustpilot_rating: index === 0 ? null : 4,
  }));
  const calls = [];
  const db = { from: table => {
    let cursor, fields;
    const query = { select: value => { fields = value; return query; }, order: field => { assert.equal(field, 'id'); return query; },
      limit: size => { assert.equal(size, 500); return query; }, eq: () => query, in: () => query, or: () => query,
      gt: (field, value) => { assert.equal(field, 'id'); cursor = value; return query; },
      then: (resolve, reject) => {
        calls.push({ table, cursor, fields });
        return Promise.resolve(failAfterFirst && cursor ? { data: null, error: new Error('unavailable') }
          : { data: rows.filter(row => !cursor || row.id > cursor).slice(0, 500), error: null }).then(resolve, reject);
      } };
    return query;
  } };
  const mocks = {
    '@tanstack/react-query': { useQuery: options => options },
    react: {}, sonner: {}, '@/lib/intranet': {},
    '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'actor' }, profile: { test_account: false } }) },
    '@/integrations/supabase/client': { supabase: db }, '@/hooks/useSupportTickets': {},
  };
  return { calls, tickets: load('src/hooks/useSupportTickets.ts', mocks), lifecycle: load('src/hooks/useLifecycle.ts', mocks) };
}
test('the Support list reads beyond one API page and selects the newest non-archived cases for dashboard shortcuts', async () => {
  const { tickets, calls } = pagedQueries();
  const all = await tickets.useSupportTickets().queryFn(); assert.equal(all.length, 1001);
  assert.deepEqual(calls.map(call => call.cursor), [undefined, '00499', '00999']);
  const recent = await tickets.useSupportTickets({ limit: 3 }).queryFn();
  assert.deepEqual(normal(recent).map(row => row.id), ['00999', '00998', '00997']);
});
test('customer success totals cover all visible API pages and select no financial or private note fields', async () => {
  const { lifecycle, calls } = pagedQueries(); const result = await lifecycle.useUserAccountStats().queryFn();
  assert.equal(result.totalUsers, 1001); assert.equal(result.activeUsers, 1000);
  assert.equal(result.averageRating, 4); assert.equal(result.atRiskUsers, 1); assert.equal(result.unpaidUsers, 1);
  assert.ok(calls.every(call => call.fields === 'id,company_name,subscription_status,risk_level,payment_status,trustpilot_rating'));
});
test('a failed Support or customer context page does not turn partial data into confirmed totals', async () => {
  const { lifecycle, tickets } = pagedQueries(true);
  await assert.rejects(lifecycle.useUserAccountStats().queryFn(), /unavailable/);
  await assert.rejects(tickets.useSupportTickets().queryFn(), /indisponibles/);
});
