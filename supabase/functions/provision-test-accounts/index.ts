import { createClient } from 'npm:@supabase/supabase-js@2';
import { testAccountSpecs, type TestAccountSpec } from '../_shared/test-account-specs.ts';
import { readBoundedJson } from '../_shared/intranet-drive.ts';

type AuthIdentity = { id: string; email?: string; user_metadata?: Record<string, unknown> };
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
const randomPassword = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)) + 'Aa1!';
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return response({ error: 'Méthode non autorisée.' }, 405);
  try {
    const token = request.headers.get('authorization');
    if (!token?.startsWith('Bearer ')) return response({ error: 'Connexion requise.' }, 401);
    const url = Deno.env.get('SUPABASE_URL') || '';
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: token } }, auth: { persistSession: false },
    });
    const { data: { user }, error: authError } = await caller.auth.getUser();
    if (authError || !user) return response({ error: 'Connexion requise.' }, 401);
    const [{ data: profile, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
      caller.from('profiles').select('app_origin,hr_status,test_account').eq('id', user.id).single(),
      caller.from('user_roles').select('role').eq('user_id', user.id),
    ]);
    if (profileError || roleError || profile?.app_origin !== 'connect' || profile?.hr_status !== 'active'
      || profile.test_account || !roles?.some((r: { role: string }) => r.role === 'admin')) {
      return response({ error: 'Administrateur réel et actif requis.' }, 403);
    }
    const body = await readBoundedJson(request, 50000);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } });
    const findUsers = async (): Promise<AuthIdentity[]> => {
      const users: AuthIdentity[] = [];
      for (let page = 1; page <= 20; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error('Vérification des comptes indisponible.');
        users.push(...(data.users || []));
        if ((data.users || []).length < 1000) return users;
      }
      throw new Error('Vérification complète des comptes indisponible.');
    };

    // Auth and profile identities must agree before a one-time link can be issued.
    if (body.action === 'sign_in') {
      const spec = testAccountSpecs.find(s => s.email === String(body.email || '').trim().toLowerCase());
      if (!spec) return response({ error: 'Compte de test non reconnu.' }, 400);
      const users = await findUsers();
      const target = users.find(u => u.email?.toLowerCase() === spec.email);
      if (!target || target.user_metadata?.test_account !== true || target.user_metadata?.job_role !== spec.id) {
        return response({ error: 'Identité de test non vérifiée.' }, 403);
      }
      const { data: targetProfile, error } = await admin.from('profiles')
        .select('id,email,test_account,app_origin,hr_status').eq('id', target.id).single();
      if (error || !targetProfile?.test_account || targetProfile.app_origin !== 'connect'
        || targetProfile.hr_status !== 'active' || targetProfile.email?.toLowerCase() !== spec.email) {
        return response({ error: 'Compte de test indisponible.' }, 403);
      }
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: spec.email });
      if (linkError || !link?.properties?.hashed_token) return response({ error: 'Connexion non confirmée.' }, 503);
      return response({ token_hash: link.properties.hashed_token });
    }

    const requested = Array.isArray(body.roles) ? body.roles : [];
    if (!requested.length || requested.length > testAccountSpecs.length) return response({ error: 'Liste de rôles invalide.' }, 400);
    const specs: TestAccountSpec[] = [];
    const seen = new Set<string>();
    for (const item of requested) {
      const roleId = typeof item === 'string' ? item : (item as { id?: unknown })?.id;
      const spec = testAccountSpecs.find(s => s.id === roleId);
      if (!spec || seen.has(spec.id)) return response({ error: 'Rôle de test inconnu ou répété.' }, 400);
      seen.add(spec.id); specs.push(spec);
    }
    const [{ data: catalog, error: catalogError }, users] = await Promise.all([
      admin.from('access_roles').select('role_key,status').in('role_key', specs.map(s => s.id)), findUsers(),
    ]);
    if (catalogError || specs.some(s => !catalog?.some((r: { role_key: string; status: string }) => r.role_key === s.id && r.status === 'active'))) {
      return response({ error: 'Un rôle est absent ou désactivé dans le catalogue.' }, 409);
    }
    const existing = new Map(users.filter(u => u.email).map(u => [u.email!.toLowerCase(), u]));
    // Check the whole batch before any Auth write, including addresses later in the list.
    for (const spec of specs) {
      const target = existing.get(spec.email);
      if (!target) continue;
      const { data: p, error } = await admin.from('profiles').select('test_account').eq('id', target.id).single();
      if (error || !p?.test_account || target.user_metadata?.test_account !== true || target.user_metadata?.job_role !== spec.id) {
        return response({ error: 'Une adresse réservée appartient à une identité non vérifiée. Aucun compte n’a été modifié.' }, 409);
      }
    }
    let created = 0, updated = 0;
    const errors: string[] = [];
    for (const spec of specs) {
      let target = existing.get(spec.email);
      let isNew = false;
      if (!target) {
        const { data, error } = await admin.auth.admin.createUser({
          email: spec.email, password: randomPassword(), email_confirm: true,
          user_metadata: { first_name: spec.label, last_name: '(test)', app_origin: 'connect', test_account: true, job_role: spec.id },
        });
        if (error || !data.user) { errors.push(`${spec.id} : création non confirmée.`); continue; }
        target = data.user as AuthIdentity;
        isNew = true; existing.set(spec.email, target);
      }
      // Reusing a test identity never resets its password or changes an Auth email.
      const { error } = await admin.rpc('configure_intranet_test_identity', {
        p_actor: user.id, p_target: target.id, p_role: spec.id,
      });
      if (error) { errors.push(`${spec.id} : configuration non confirmée.`); continue; }
      if (isNew) created++; else updated++;
    }
    return response({ created, updated, errors });
  } catch {
    return response({ error: 'La demande n’a pas pu être confirmée. Réessayez.' }, 503);
  }
});
