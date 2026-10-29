import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(read(file), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  const require = name => {
    if (name in mocks) return mocks[name];
    if (name.startsWith('.')) return load(path.relative(root, path.resolve(root, path.dirname(file), name)), mocks, globals);
    throw new Error('Unexpected dependency: ' + name);
  };
  vm.runInNewContext(code, { exports, require, crypto, Request, Response, Headers, URL,
    TextEncoder, TextDecoder, Uint8Array, ArrayBuffer, atob, btoa, console, ...globals });
  return exports;
}
const specs = load('supabase/functions/_shared/test-account-specs.ts').testAccountSpecs;
const normal = value => JSON.parse(JSON.stringify(value));
const id = n => `10000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const request = body => new Request('https://bib.test/function', { method: 'POST',
  headers: { Authorization: 'Bearer caller-jwt', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('the test identity catalog matches all frontend roles and the private SQL specifications', () => {
  const catalog = load('src/data/jobRoles.ts');
  const expected = catalog.jobRoles.map(r => ({ id: r.id, label: r.label, position: r.position,
    poles: r.poles, seniority: r.seniority, email: catalog.testAccountEmail(r) }));
  const seed = read('drizzle/migrations/0044_intranet_identity_and_test_isolation.sql').match(/\$test_specs\$([\s\S]*?)\$test_specs\$/)[1];
  assert.equal(expected.length, 114);
  assert.deepEqual(normal(specs), normal(expected));
  assert.deepEqual(JSON.parse(seed), normal(expected));
});

async function provision(options = {}) {
  const calls = { clients: [], created: [], configured: [], links: [] };
  const users = options.users || [];
  const operator = { app_origin: 'connect', hr_status: 'active', test_account: false, ...options.operator };
  class Query {
    constructor(table, privileged) { this.table = table; this.privileged = privileged; }
    select() { return this; } eq(key, value) { this[key] = value; return this; }
    in(key, values) { this[key] = values; return this; }
    single() { return Promise.resolve(this.result()); }
    then(resolve, reject) { return Promise.resolve(this.result()).then(resolve, reject); }
    result() {
      if (this.table === 'user_roles') return { data: options.admin === false ? [] : [{ role: 'admin' }], error: null };
      if (this.table === 'profiles') return { data: this.privileged ? (options.profiles?.[this.id] || null) : operator, error: null };
      if (this.table === 'access_roles') return { data: this.role_key.map(role_key => ({ role_key,
        status: role_key === options.inactiveRole ? 'inactive' : 'active' })), error: null };
      throw new Error('Unexpected table: ' + this.table);
    }
  }
  const caller = { auth: { getUser: async () => ({ data: { user: options.unauthenticated ? null : { id: id(1) } }, error: null }) }, from: table => new Query(table, false) };
  const admin = { from: table => new Query(table, true), rpc: async (name, args) => {
    calls.configured.push({ name, args }); return { data: null, error: args.p_role === options.configurationFailure ? { code: '42501' } : null };
  }, auth: { admin: {
    listUsers: async () => ({ data: { users }, error: options.listFailure ? { message: 'unavailable' } : null }),
    createUser: async input => { calls.created.push(input); return { data: { user: { id: id(20 + calls.created.length), ...input } }, error: null }; },
    updateUserById: async () => { throw new Error('Existing test passwords and Auth identities must never be reset'); },
    generateLink: async input => { calls.links.push(input); return { data: { properties: { hashed_token: 'single-use-token' } }, error: null }; },
  } } };
  let handler;
  const environment = { SUPABASE_URL: 'https://supabase.test', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'service' };
  load('supabase/functions/provision-test-accounts/index.ts', { 'npm:@supabase/supabase-js@2': { createClient: (_, key, settings) => {
    calls.clients.push({ key, settings }); return key === 'service' ? admin : caller;
  } } }, { Deno: { env: { get: key => environment[key] }, serve: fn => { handler = fn; } } });
  const response = await handler(request(options.body || { roles: [specs[0].id] }));
  return { status: response.status, body: await response.json(), calls };
}

test('only a real, active intranet administrator can reach privileged test-account operations', async () => {
  for (const options of [{ unauthenticated: true }, { admin: false }, { operator: { test_account: true } },
    { operator: { hr_status: 'inactive' } }, { operator: { app_origin: 'bos' } }]) {
    const r = await provision(options);
    assert.ok([401, 403].includes(r.status));
    assert.deepEqual(r.calls.clients.map(c => c.key), ['anon']);
    assert.equal(r.calls.created.length + r.calls.configured.length + r.calls.links.length, 0);
  }
});
test('test provisioning ignores caller-supplied identity and authority fields', async () => {
  const spec = specs[0];
  const r = await provision({ body: { roles: [{ id: spec.id, email: 'real@bib.test', position: 'forged', poles: ['forged'], seniority: 'forged', label: 'forged' }] } });
  assert.equal(r.status, 200); assert.equal(r.body.created, 1);
  const created = r.calls.created[0];
  assert.equal(created.email, spec.email); assert.equal(created.user_metadata.first_name, spec.label);
  assert.equal(created.user_metadata.test_account, true); assert.equal(created.user_metadata.job_role, spec.id);
  assert.equal(created.email_confirm, true); assert.ok(created.password.length > 40);
  assert.equal('position' in created.user_metadata, false);
  assert.deepEqual(normal(r.calls.configured[0]), { name: 'configure_intranet_test_identity', args: { p_actor: id(1), p_target: id(21), p_role: spec.id } });
});
test('a real identity at any reserved address rejects the entire batch before an Auth write', async () => {
  const spec = specs[1];
  const r = await provision({ body: { roles: [specs[0].id, spec.id] }, users: [{ id: id(2), email: spec.email, user_metadata: {} }], profiles: { [id(2)]: { test_account: false } } });
  assert.equal(r.status, 409); assert.equal(r.calls.created.length, 0); assert.equal(r.calls.configured.length, 0);
});
test('existing verified test accounts are configured without resetting Auth credentials', async () => {
  const spec = specs[0];
  const r = await provision({ users: [{ id: id(2), email: spec.email, user_metadata: { test_account: true, job_role: spec.id } }], profiles: { [id(2)]: { test_account: true } } });
  assert.equal(r.status, 200); assert.equal(r.body.updated, 1); assert.equal(r.body.created, 0);
  assert.equal(r.calls.created.length, 0); assert.equal(r.calls.configured[0].args.p_target, id(2));
});
test('unknown, duplicate, inactive roles and unavailable preflight do not create Auth users', async () => {
  for (const options of [{ body: { roles: ['unknown'] } }, { body: { roles: [specs[0].id, specs[0].id] } },
    { inactiveRole: specs[0].id }, { listFailure: true }]) {
    const r = await provision(options); assert.ok(r.status >= 400);
    assert.equal(r.calls.created.length, 0); assert.equal(r.calls.configured.length, 0);
  }
});
test('failed profile configuration never reports a completed test account', async () => {
  const r = await provision({ configurationFailure: specs[0].id });
  assert.equal(r.status, 200); assert.equal(r.body.created, 0); assert.equal(r.body.updated, 0);
  assert.equal(r.body.errors.length, 1);
});
test('a one-time test sign-in requires matching Auth and active test profile identities', async () => {
  const spec = specs[0]; const body = { action: 'sign_in', email: spec.email };
  const users = [{ id: id(2), email: spec.email, user_metadata: { test_account: true, job_role: spec.id } }];
  for (const target of [{ test_account: false }, { test_account: true, app_origin: 'bos' },
    { test_account: true, app_origin: 'connect', hr_status: 'active', email: 'other@bib.test' }]) {
    const r = await provision({ body, users, profiles: { [id(2)]: target } });
    assert.equal(r.status, 403); assert.equal(r.calls.links.length, 0);
  }
  const r = await provision({ body, users, profiles: { [id(2)]: { test_account: true, app_origin: 'connect', hr_status: 'active', email: spec.email } } });
  assert.equal(r.status, 200); assert.equal(r.body.token_hash, 'single-use-token');
  assert.deepEqual(normal(r.calls.links), [{ type: 'magiclink', email: spec.email }]);
});

async function drive(options = {}) {
  const calls = { delegated: [], clients: 0, drive: 0 };
  const shared = load('supabase/functions/_shared/intranet-drive.ts');
  const profile = { id: id(1), app_origin: 'connect', hr_status: 'active', email: 'staff@bib.test', ...options.profile };
  const caller = { auth: { getUser: async () => ({ data: { user: { id: id(1), email: 'staff@bib.test',
    email_confirmed_at: '2026-01-01', user_metadata: { email: 'forged@bib.test' }, ...options.user } }, error: null }) },
    from: () => ({ select() { return this; }, eq() { return this; }, single: async () => ({ data: profile, error: null }) }) };
  const environment = { SUPABASE_URL: 'https://supabase.test', SUPABASE_ANON_KEY: 'anon', BIB_APP_ORIGIN: 'https://bib.test' };
  let handler;
  load('supabase/functions/intranet-drive/index.ts', {
    'npm:@supabase/supabase-js@2': { createClient: () => { calls.clients++; return caller; } },
    '../_shared/document-watermark.ts': {}, '../_shared/spreadsheet-export.ts': {},
    '../_shared/intranet-drive.ts': { ...shared, getDriveConfig: () => ({ domain: 'bib.test' }),
      WorkspaceDrive: class { constructor() { calls.drive++; } async list(email) { calls.delegated.push(email); return { files: [] }; } } },
  }, { Deno: { env: { get: key => environment[key] }, serve: fn => { handler = fn; } } });
  const response = await handler(request({ action: 'list' }));
  return { status: response.status, body: await response.json(), calls };
}
test('Drive delegation rejects a mutable profile address or unconfirmed Auth email before accessing Google', async () => {
  for (const options of [{ profile: { email: 'other@bib.test' } }, { user: { email_confirmed_at: null } },
    { user: { email: null } }, { profile: { app_origin: 'bos' } }, { profile: { hr_status: 'inactive' } }]) {
    const r = await drive(options); assert.equal(r.status, 403);
    assert.equal(r.calls.drive, 0); assert.equal(r.calls.delegated.length, 0);
  }
});
test('Drive delegates only the verified Auth address and normalizes harmless casing', async () => {
  const r = await drive({ user: { email: ' Staff@BIB.test ' } });
  assert.equal(r.status, 200); assert.deepEqual(r.calls.delegated, ['staff@bib.test']);
});
