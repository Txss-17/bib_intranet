import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../../src/hooks/useWorkModule.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
function harness() {
  const calls = { rpc: [], writes: [], filters: [], invalidated: [] };
  const state = { uncertain: false, stale: false };
  const query = { update(patch) { calls.writes.push(patch); return this; },
    eq(key, value) { calls.filters.push([key, value]); return this; }, select() { return this; },
    single: async () => ({ data: state.stale ? null : { id: 'record' }, error: state.stale ? { code: 'PGRST116' } : null }) };
  const exports = {};
  const mocks = {
    '@tanstack/react-query': { useMutation: options => options, useQuery: options => options,
      useQueryClient: () => ({ invalidateQueries: async ({ queryKey }) => { calls.invalidated.push(queryKey[0]); } }) },
    react: { useRef: value => ({ current: value }) },
    '@/hooks/useAuth': { useAuth: () => ({ user: { id: 'actor' } }) },
    '@/lib/intranet': { intranetRpc: async (name, args) => {
      calls.rpc.push({ name, args }); if (state.uncertain) throw new Error('network interrupted'); return { id: 'record', revision: 1 };
    } },
    '@/integrations/supabase/client': { supabase: { from: () => query } },
    sonner: { toast: { success() {}, error() {} } },
  };
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in mocks)) throw new Error('Unexpected import ' + name); return mocks[name];
  }, crypto });
  return { actions: exports.useWorkModuleActions('validations'), calls, state };
}
const normal = value => JSON.parse(JSON.stringify(value));

test('an uncertain Work creation reuses its key until a server confirmation, then permits a new record', async () => {
  const { actions, calls, state } = harness(); const payload = { title: 'Review', validator_id: 'reviewer' };
  state.uncertain = true; await assert.rejects(actions.create.mutationFn(payload));
  state.uncertain = false; await actions.create.mutationFn(payload);
  assert.equal(calls.rpc[0].args.p_key, calls.rpc[1].args.p_key);
  await actions.create.mutationFn(payload);
  assert.notEqual(calls.rpc[1].args.p_key, calls.rpc[2].args.p_key);
});
test('a decision carries its original revision and motive to the server without client decision metadata', async () => {
  const { actions, calls } = harness();
  await actions.update.mutationFn({ id: 'record', revision: 4, status: 'approved', change_note: 'Checked', decided_at: '1999-01-01', decided_by: 'forged' });
  assert.equal(calls.writes.length, 0);
  assert.deepEqual(normal(calls.rpc[0]), { name: 'transition_work_module_record', args: {
    p_kind: 'validations', p_id: 'record', p_revision: 4, p_status: 'approved', p_note: 'Checked',
  } });
});
test('editing content uses compare-and-swap and reports a missing or stale record as unconfirmed', async () => {
  const { actions, calls, state } = harness(); state.stale = true;
  await assert.rejects(actions.update.mutationFn({ id: 'record', revision: 4, validator_id: 'next-reviewer' }), /changé/);
  assert.deepEqual(normal(calls.filters), [['id', 'record'], ['revision', 4]]);
  assert.deepEqual(normal(calls.writes), [{ validator_id: 'next-reviewer', revision: 5 }]);
});
test('removal archives with a revision and successful mutations refresh history, activity and notifications', async () => {
  const { actions, calls } = harness();
  await actions.remove.mutationFn({ id: 'record', revision: 7 });
  assert.equal(calls.rpc[0].args.p_status, 'archived'); assert.equal(calls.rpc[0].args.p_revision, 7);
  actions.remove.onSuccess();
  for (const key of ['work-validations', 'work-module-events', 'work-activity', 'notifications']) assert.ok(calls.invalidated.includes(key));
});
