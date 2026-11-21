import { createClient } from 'npm:@supabase/supabase-js@2';

const BUCKET = 'rh-personnel-vault';
const MAX_BYTES = 5 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Category = 'identity' | 'medical' | 'payroll' | 'disciplinary';
type Mime = 'application/pdf' | 'image/png' | 'image/jpeg';
type Reserved = { document_id: string; reference: string; storage_path: string; state: string };

const isCategory = (value: unknown): value is Category =>
  ['identity', 'medical', 'payroll', 'disciplinary'].includes(String(value));

function detectedMime(bytes: Uint8Array): Mime | null {
  if (bytes.length >= 5 && bytes[0] === 0x25 && bytes[1] === 0x50 &&
    bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) return 'application/pdf';
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10]
      .every((x, i) => bytes[i] === x)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 &&
    bytes[2] === 0xff) return 'image/jpeg';
  return null;
}

function json(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

Deno.serve(async (request: Request) => {
  const origin = Deno.env.get('BIB_APP_ORIGIN') ?? '';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Vary': 'Origin',
  };
  try {
    if (!origin || (request.headers.get('Origin') && request.headers.get('Origin') !== origin))
      return json({ error: 'Origine non autorisée.' }, 403, headers);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405, headers);

    const authorization = request.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return json({ error: 'Session requise.' }, 401, headers);
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Coffre indisponible.' }, 503, headers);

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: userData, error: authError } = await caller.auth.getUser(
      authorization.slice('Bearer '.length),
    );
    if (authError || !userData.user) return json({ error: 'Session expirée.' }, 401, headers);

    // The configuration RPC is bound to the current authenticated, active,
    // non-test Connect user; it does NOT return sensitive document metadata.
    const { data: settingRows, error: settingError } = await caller.rpc('rh_private_vault_status');
    const policy = (settingRows as Array<{ upload_enabled: boolean; max_size_bytes: number }> | null)?.[0];
    if (settingError || !policy?.upload_enabled)
      return json({ error: 'Le coffre RH privé attend sa validation sécurité et RGPD.' }, 423, headers);

    // Read uploaded bytes only AFTER verifying the central feature switch.
    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BYTES + 16384)
      return json({ error: 'Fichier trop volumineux.' }, 413, headers);
    const form = await request.formData();
    const category = form.get('category');
    const file = form.get('file');
    const requestKey = form.get('request_key');
    if (!isCategory(category) || typeof requestKey !== 'string' || !UUID.test(requestKey) ||
      !(file instanceof File) || file.size === 0 || file.size > MAX_BYTES ||
      file.size > policy.max_size_bytes) {
      return json({ error: 'Fichier, catégorie ou demande invalide.' }, 400, headers);
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength !== file.size) return json({ error: 'Taille invalide.' }, 400, headers);
    const mime = detectedMime(bytes);
    if (!mime || file.type !== mime) return json({ error: 'Format refusé.' }, 415, headers);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const sha = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');

    const { data: reservations, error: reserveError } = await caller.rpc(
      'rh_reserve_private_vault_document', {
        p_category: category, p_mime_type: mime, p_size_bytes: bytes.byteLength,
        p_sha256: sha, p_request_key: requestKey,
      },
    );
    const reservation = (reservations as Reserved[] | null)?.[0];
    if (reserveError || !reservation) return json({ error: 'Réservation documentaire refusée.' }, 403, headers);
    if (reservation.state === 'quarantined')
      return json({ reference: reservation.reference, state: 'quarantined' }, 200, headers);
    if (reservation.state !== 'reserved' || !UUID.test(reservation.document_id) ||
      !/^[0-9a-f-]{36}\/sealed$/i.test(reservation.storage_path))
      return json({ error: 'Réservation documentaire non valide.' }, 409, headers);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(
      reservation.storage_path, bytes,
      { upsert: false, cacheControl: '0', contentType: mime },
    );
    if (uploadError) {
      await admin.from('rh_private_vault_documents').update({
        state: 'failed', last_error_code: 'storage_upload_failed',
      }).eq('id', reservation.document_id).eq('state', 'reserved');
      return json({ error: 'Le dépôt sécurisé a échoué.' }, 503, headers);
    }

    const { data: finalized, error: finalError } = await admin
      .from('rh_private_vault_documents')
      .update({ state: 'quarantined', quarantined_at: new Date().toISOString() })
      .eq('id', reservation.document_id).eq('state', 'reserved')
      .select('id').single();
    if (finalError || !finalized) {
      await admin.storage.from(BUCKET).remove([reservation.storage_path]);
      await admin.from('rh_private_vault_documents').update({
        state: 'failed', last_error_code: 'quarantine_registry_failed',
      }).eq('id', reservation.document_id);
      return json({ error: 'Le dépôt sécurisé n’a pas été confirmé.' }, 503, headers);
    }
    const { error: auditError } = await admin.from('rh_private_vault_events').insert({
      document_id: reservation.document_id,
      subject_id: userData.user.id,
      actor_id: userData.user.id,
      event_type: 'quarantined',
    });
    if (auditError) {
      await admin.storage.from(BUCKET).remove([reservation.storage_path]);
      await admin.from('rh_private_vault_documents').update({
        state: 'failed', last_error_code: 'audit_failed',
      }).eq('id', reservation.document_id);
      return json({ error: 'Traçabilité du dépôt indisponible.' }, 503, headers);
    }
    // No download, public URL, signed URL or "clean" transition exists here.
    // Another independently reviewed malware-scanning service must release it.
    return json({ reference: reservation.reference, state: 'quarantined' }, 201, headers);
  } catch {
    // Avoid propagating storage paths, document metadata or private bytes.
    return json({ error: 'Le traitement sécurisé n’a pas abouti.' }, 400, headers);
  }
});
