// CEO-controlled sign-in suspension after independently approved RH departure.
// This is NOT a session revocation or completion workflow.
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Méthode interdite.' }, 405);
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json({ error: 'Authentification requise.' }, 401);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !anonKey || !serviceKey) return json({ error: 'Configuration serveur incomplète.' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 4096)
    return json({ error: 'Demande trop volumineuse.' }, 413);

  let input: unknown;
  try { input = await request.json(); } catch { return json({ error: 'JSON attendu.' }, 400); }
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return json({ error: 'Demande invalide.' }, 400);
  const caseId = (input as Record<string, unknown>).caseId;
  if (typeof caseId !== 'string' || !uuid.test(caseId))
    return json({ error: 'Dossier de départ invalide.' }, 400);

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: identity, error: identityError } = await caller.auth.getUser();
  if (identityError || !identity.user)
    return json({ error: 'Session non autorisée.' }, 401);

  // The SECURITY DEFINER RPC checks the canonical CEO's active role, the
  // approval by a different requester and the effective date. The client never
  // supplies the target user ID. Avoid a service-role client until this passes.
  const { data: target, error: permissionError } = await caller.rpc(
    'rh_departure_auth_block_target',
    { p_case: caseId },
  );
  if (permissionError || typeof target !== 'string' || !uuid.test(target) ||
    target === identity.user.id) {
    return json({ error: 'Dossier non approuvé, date non atteinte ou accès refusé.' }, 403);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: banError } = await admin.auth.admin.updateUserById(
    target,
    { ban_duration: '876000h' },
  );
  if (banError) {
    // No ledger success on partial failure.
    return json({ error: 'Blocage Auth non confirmé : vérifier l’état du compte.' }, 502);
  }

  // Server re-reads Auth's banned_until, records the CEO actor and only marks
  // "auth_signin". In case of a network failure here, repeat is idempotent.
  const { data: recorded, error: recordError } = await caller.rpc(
    'rh_departure_record_auth_block',
    { p_case: caseId },
  );
  if (recordError || recorded !== true) {
    return json({
      error: 'Blocage Auth possiblement appliqué ; preuve RH non enregistrée. Relancer la vérification.',
      sessions_revoked: false,
      departure_closed: false,
    }, 502);
  }

  return json({
    signins_blocked_verified: true,
    sessions_revoked: false,
    existing_jwts_invalidated: false,
    external_access_revoked: false,
    departure_closed: false,
    message: 'Nouvelles connexions bloquées. La révocation des sessions, droits et services tiers reste obligatoire.',
  });
});
