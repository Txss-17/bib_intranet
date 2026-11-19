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

test('retired test-account provisioning refuses every request before using Auth or secrets', async () => {
  let handler;
  load('supabase/functions/provision-test-accounts/index.ts', {}, {
    Deno: { env: { get: () => { throw new Error('A disabled endpoint must not read credentials'); } }, serve: fn => { handler=fn; } },
  });
  for (const body of [{}, {roles:[specs[0].id]}, {action:'sign_in',email:specs[0].email}, {roles:[{id:'ceo',email:'other@example.invalid',test_account:false}]}]) {
    for (const authorization of [undefined,'Bearer forged-credential']) {
      const headers={'content-type':'application/json'};
      if(authorization) headers.authorization=authorization;
      const response=await handler(new Request('https://bib.test/function',{method:'POST',headers,body:JSON.stringify(body)}));
      assert.equal(response.status,410);
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.deepEqual(await response.json(),{error:'test_account_provisioning_disabled'});
    }
  }
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
