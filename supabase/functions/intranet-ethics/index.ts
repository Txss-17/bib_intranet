import { readBoundedJson } from '../_shared/intranet-drive.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encryptEthics, decryptEthics, normalizedEthicsReport } from '../_shared/ethics-crypto.ts';
import { documentHash } from '../_shared/intranet-drive.ts';
Deno.serve(async request => {
 const origin = Deno.env.get('BIB_APP_ORIGIN') || ''; const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };
 const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
 try {
  if (request.headers.get('origin') && request.headers.get('origin') !== origin) return response({ error: 'Origine refusée.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return response({ error: 'Méthode non autorisée.' }, 405);
  const authorization = request.headers.get('authorization'); if (!authorization?.startsWith('Bearer ')) return response({ error: 'Connexion requise.' }, 401);
  const caller = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '', { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error } = await caller.auth.getUser(); if (error || !user) return response({ error: 'Connexion requise.' }, 401);
  const secret = Deno.env.get('BIB_ETHICS_ENCRYPTION_KEY'); if (!secret) return response({ error: 'Le canal confidentiel attend sa configuration par l’administrateur.' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 100000) return response({ error: 'Signalement trop volumineux.' }, 413);
  const body = await readBoundedJson(request, 100000);
  if (body.action === 'read') {
   const { data, error } = await caller.rpc('read_intranet_ethics', { p_id: body.id }); if (error || !data?.ciphertext) return response({ error: 'Accès au signalement refusé.' }, 403);
   return response(await decryptEthics(data.ciphertext, secret));
  }
  if (body.action !== 'submit') return response({ error: 'Action inconnue.' }, 400);
  const { data: allowed, error: permissionError } = await caller.rpc('can_intranet_action', { p_page: 'ethics.report', p_action: 'create' }); if (permissionError || allowed !== true) return response({ error: 'Accès au signalement refusé.' }, 403);
  const { data: profile, error: profileError } = await caller.from('profiles').select('test_account').eq('id', user.id).single(); if (profileError || !profile) return response({ error: 'Profil indisponible.' }, 403);
  if (typeof body.request_key !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.request_key)) return response({ error: 'Référence de demande invalide.' }, 400);
  const report = normalizedEthicsReport(body.report); const ciphertext = await encryptEthics(report, secret); const hash = await documentHash(JSON.stringify(report));
  const admin = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } });
  const { data: receipt, error: writeError } = await admin.rpc('store_intranet_ethics_report', { p_key: body.request_key, p_hash: hash, p_category: report.category, p_severity: report.severity, p_ciphertext: ciphertext, p_mode: report.mode, p_test: profile.test_account === true });
  if (writeError || !receipt?.reference) return response({ error: 'Le signalement n’est pas confirmé. Conservez votre saisie et réessayez.' }, 503);
  return response(receipt);
 } catch { return response({ error: 'Le signalement n’a pas pu être traité. Vérifiez les champs puis réessayez.' }, 400); }
});
