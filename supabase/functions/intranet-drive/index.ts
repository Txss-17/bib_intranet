import { createClient } from 'npm:@supabase/supabase-js@2';
import { DriveError, WorkspaceDrive, getDriveConfig, workspaceEmail, parseDriveId, decodeDocumentBase64, documentHash, DriveFile, readBoundedJson } from '../_shared/intranet-drive.ts';
import { documentAsPdf, watermarkDocument } from '../_shared/document-watermark.ts';
import { createStampedSpreadsheet } from '../_shared/spreadsheet-export.ts';
type RpcClient = { rpc(name: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }> };
type Job = { id: string; lease_token: string; file_id: string | null; shortcut_id: string | null; request_hash: string; status: string; result: unknown; created_at: string };
type Document = { owner_id: string; id: string; file_id: string; page_id: string; name: string; mime_type: string; classification: string };
async function call<T>(client: unknown, name: string, args: Record<string, unknown> = {}) {
 const { data, error } = await (client as RpcClient).rpc(name, args); if (error) throw new DriveError(error.code === '40001' ? 'Une opération est déjà en cours ou la demande a changé. Réessayez dans quelques instants.' : 'Accès documentaire refusé.', error.code === '40001' ? 409 : 403); return data as T;
}
const uuid = (v: unknown) => { if (typeof v !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)) throw new DriveError('Identifiant de demande invalide.'); return v; };
export async function handleDriveRequest(request: Request) {
 let job: Job | undefined; let admin: ReturnType<typeof createClient> | undefined;
 const origin = Deno.env.get('BIB_APP_ORIGIN') || ''; const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
 const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
 try {
  if (request.headers.get('origin') && request.headers.get('origin') !== origin) throw new DriveError('Origine non autorisée.', 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  const authorization = request.headers.get('authorization'); if (!authorization?.startsWith('Bearer ')) throw new DriveError('Connexion requise.', 401);
  const url = Deno.env.get('SUPABASE_URL') || ''; const key = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const caller = createClient(url, key, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: identity, error: authError } = await caller.auth.getUser(); if (authError || !identity.user) throw new DriveError('Connexion requise.', 401);
  // Email and app status are authoritative profile fields, never client metadata.
  const { data: profile, error: profileError } = await caller.from('profiles').select('id,email,app_origin,hr_status,test_account').eq('id', identity.user.id).single();
  if (profileError || !profile || profile.app_origin !== 'connect' || profile.hr_status !== 'active') throw new DriveError('Compte intranet actif requis.', 403);
  if (Number(request.headers.get('content-length') || 0) > 28000000) throw new DriveError('Document trop volumineux.', 413);
  const body = await readBoundedJson(request, 28000000); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new DriveError('Demande invalide.');
  if (body.action === 'status') {
   try { getDriveConfig(k => Deno.env.get(k)); return json({ configured: true }); } catch { return json({ configured: false, message: 'Google Workspace BIB attend sa configuration par l’administrateur.' }); }
  }
  const config = getDriveConfig(k => Deno.env.get(k)); const email = workspaceEmail(profile.email, config.domain); const drive = new WorkspaceDrive(config);
  if (body.action === 'list') return json(await drive.list(email, typeof body.search === 'string' ? body.search : '', typeof body.page_token === 'string' ? body.page_token : undefined));
  if (body.action === 'preview') {
   const d = await call<Document>(caller, 'get_intranet_document_access', { p_id: uuid(body.document_id) });
   if (['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(d.mime_type)) return json({ message: 'Ce tableau est enregistré dans Drive BIB. Pour une consultation ou une diffusion dans l’intranet, utilisez une version PDF.', drive_url: d.owner_id === profile.id ? `https://drive.google.com/file/d/${d.file_id}/view` : undefined });
   const file = await drive.metadata(config.custodian, d.file_id); const raw = await drive.bytes(config.custodian, file);
   const pdf = await documentAsPdf(raw, d.mime_type); const data = await watermarkDocument(pdf, email, new Date().toISOString(), crypto.randomUUID());
   return new Response(data, { headers: { ...headers, 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="document-bib.pdf"' } });
  }
  if (typeof body.action !== 'string' || !['import', 'export', 'share'].includes(body.action)) throw new DriveError('Action documentaire inconnue.');
  const requestKey = body.action === 'share' ? uuid(body.share_id) : uuid(body.request_key); let page = typeof body.page_id === 'string' ? body.page_id : '';
  let share: { request: { id: string; recipient: string; release_file_id: string | null }; document: Document } | undefined;
  if (body.action === 'share') {
   share = await call<NonNullable<typeof share>>(caller, 'get_approved_intranet_share', { p_id: uuid(body.share_id) }); page = share.document.page_id;
   if (share.request.release_file_id) return json({ drive_url: `https://drive.google.com/file/d/${share.request.release_file_id}/view` });
  }
  const action = body.action as 'import' | 'export' | 'share';
  const name = share ? `${share.document.name.replace(/\.pdf$/i, '')}.pdf` : typeof body.name === 'string' ? body.name.trim().slice(0, 255) : 'Document BIB.pdf';
  if (!name || !page) throw new DriveError('Nom et module requis.');
  const source = action === 'import' ? parseDriveId(body.source) : null;
  const publicAsset = action === 'import' && body.public_asset === true;
  if (publicAsset && !/^(supplier|ops|product|marketing)\./.test(page)) throw new DriveError('Ce module ne publie pas de visuels de catalogue.', 403);
  const classification = body.classification === 'internal' ? 'internal' : 'confidential';
  const mime = action === 'export' ? body.mime_type : 'application/pdf';
  const content = action === 'export' && mime !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ? decodeDocumentBase64(body.content) : undefined;
  if (action === 'export' && (typeof mime !== 'string' || !['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mime))) throw new DriveError('Format d’export non pris en charge.');
  const digest = await documentHash(JSON.stringify({ action, page, name, source, content: body.content || null, table: body.table || null, mime, classification, publicAsset, share: share?.request.id || null }));
  const metadata = { name, source, classification, public_asset: publicAsset, share_id: share?.request.id || null };
  job = await call<Job>(caller, 'reserve_intranet_document_job', { p_key: requestKey, p_page: page, p_kind: action, p_hash: digest, p_metadata: metadata });
  if (job.status === 'done') { const prior = job.result as Record<string, unknown>; return json(publicAsset ? { ...prior, url: prior.drive_url } : prior); }
  admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '', { auth: { persistSession: false } });
  await drive.assertManagedFolder();
  if (!job.file_id) { job.file_id = await drive.generateId(); await call(admin, 'set_intranet_document_job_ids', { p_job: job.id, p_lease: job.lease_token, p_file: job.file_id }); }
  let bytes: Uint8Array; let resultMime = 'application/pdf';
  let existing: DriveFile | undefined;
  try { existing = await drive.metadata(config.custodian, job.file_id); } catch (e) { if (!(e instanceof DriveError) || e.status !== 404) throw e; }
  if (existing) {
   if (existing.appProperties?.bib_job !== job.id || existing.appProperties?.bib_hash !== digest) throw new DriveError('Conflit documentaire.', 409);
   bytes = await drive.bytes(config.custodian, existing); resultMime = existing.mimeType;
  } else if (action === 'import') {
   const file = await drive.metadata(email, source!); const raw = await drive.bytes(email, file);
   if (publicAsset) {
    const png = file.mimeType === 'image/png' && raw[0] === 137 && raw[1] === 80 && raw[2] === 78 && raw[3] === 71;
    const jpeg = file.mimeType === 'image/jpeg' && raw[0] === 255 && raw[1] === 216 && raw[2] === 255;
    if (!png && !jpeg) throw new DriveError('Un visuel de catalogue doit être une image PNG ou JPEG.');
    bytes = raw; resultMime = file.mimeType;
   } else bytes = await documentAsPdf(raw, file.mimeType.startsWith('application/vnd.google-apps.') ? 'application/pdf' : file.mimeType);
  } else if (action === 'share') {
   const file = await drive.metadata(config.custodian, share!.document.file_id); const raw = await drive.bytes(config.custodian, file); bytes = await documentAsPdf(raw, share!.document.mime_type);
   bytes = await watermarkDocument(bytes, email, job.created_at, job.id, share!.request.recipient);
  } else {
   resultMime = mime as string;
   if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') bytes = createStampedSpreadsheet(body.table, email, job.created_at, job.id);
   else if (mime === 'text/csv') {
    const metadata = new TextEncoder().encode(`BIB - usage professionnel\r\nCompte,${email}\r\nHorodatage,${job.created_at}\r\nTrace,${job.id}\r\n\r\n`);
    bytes = new Uint8Array(metadata.length + content!.length); bytes.set(metadata); bytes.set(content!, metadata.length);
   } else bytes = content!;
   if (mime === 'application/pdf') bytes = await watermarkDocument(await documentAsPdf(bytes, mime), email, job.created_at, job.id);
  }
  await drive.upload(job.file_id, name, resultMime, bytes, job.id, digest); await drive.protect(job.file_id);
  let resultUrl: string | null = null;
  if (publicAsset) {
   const path = `drive-assets/${identity.user.id}/${job.id}.${resultMime === 'image/png' ? 'png' : 'jpg'}`;
   const { error } = await admin.storage.from('product-assets').upload(path, bytes, { contentType: resultMime, upsert: true });
   if (error) throw new DriveError('Le visuel n’a pas pu être publié.', 502);
   resultUrl = admin.storage.from('product-assets').getPublicUrl(path).data.publicUrl;
  }
  if (action === 'export') {
   await drive.grantReader(job.file_id, email);
   if (!job.shortcut_id) { job.shortcut_id = await drive.generateId(email, 'shortcuts'); await call(admin, 'set_intranet_document_job_ids', { p_job: job.id, p_lease: job.lease_token, p_file: job.file_id, p_shortcut: job.shortcut_id }); }
   await drive.shortcut(email, job.shortcut_id, job.file_id, name); resultUrl = `https://drive.google.com/file/d/${job.file_id}/view`;
  } else if (action === 'share') {
   await drive.grantReader(job.file_id, share!.request.recipient, new Date(Date.now() + 7 * 86400000).toISOString());
   await call(admin, 'finish_intranet_external_share', { p_id: share!.request.id, p_file: job.file_id }); resultUrl = `https://drive.google.com/file/d/${job.file_id}/view`;
  }
  const result = await call(admin, 'finish_intranet_document_job', { p_job: job.id, p_lease: job.lease_token, p_name: name, p_mime: resultMime, p_size: bytes.length, p_classification: classification, p_url: resultUrl });
  return json(publicAsset ? { ...(result as Record<string, unknown>), url: resultUrl } : result);
 } catch (error) {
  if (job && admin) await call(admin, 'fail_intranet_document_job', { p_job: job.id, p_lease: job.lease_token }).catch(() => undefined);
  return json({ error: error instanceof DriveError ? error.message : 'L’opération documentaire n’a pas pu aboutir.' }, error instanceof DriveError ? error.status : 500);
 }
}
Deno.serve(handleDriveRequest);
