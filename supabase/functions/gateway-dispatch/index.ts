import { createClient } from 'npm:@supabase/supabase-js@2';
import { documentHash, readBoundedJson } from '../_shared/intranet-drive.ts';
import { listGmailMessages } from '../_shared/google-gmail.ts';
Deno.serve(async request => {
 const origin = Deno.env.get('BIB_APP_ORIGIN') || ''; const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
 const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
 try {
  if (request.headers.get('origin') && request.headers.get('origin') !== origin) return reply({ error: 'Origine refusée.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'Méthode non autorisée.' }, 405);
  const token = request.headers.get('authorization'); if (!token?.startsWith('Bearer ')) return reply({ error: 'Connexion requise.' }, 401);
  const url = Deno.env.get('SUPABASE_URL') || ''; const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') || '', { global: { headers: { Authorization: token } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser(); if (authError || !user) return reply({ error: 'Connexion requise.' }, 401);
  const body = await readBoundedJson(request, 10000);
  if (typeof body.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(body.id) || !['dispatch', 'reconcile'].includes(String(body.action))) return reply({ error: 'Demande invalide.' }, 400);
  const { data: outbox, error } = await caller.rpc('get_intranet_outbox_for_dispatch', { p_id: body.id }); if (error || !outbox) return reply({ error: 'Une approbation valide est requise avant l’envoi.' }, 403);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  if (body.action === 'reconcile') {
   const { data: deliveries, error } = await admin.from('intranet_email_dispatch').select('dispatch_key,message_id,payload,status').eq('outbox_id', outbox.id).in('status', ['unknown', 'sending']); if (error) throw error;
   let confirmed = 0;
   for (const delivery of deliveries || []) {
    const id = delivery.payload?.rfc_message_id; if (typeof id !== 'string') continue;
    const result = await listGmailMessages({ query: `in:sent rfc822msgid:${id.replace(/[<>]/g, '')}`, maxResults: 2 });
    if (result.messages?.length === 1) {
     const { error } = await admin.rpc('mark_intranet_delivery_sent', { p_key: delivery.dispatch_key, p_message: delivery.message_id, p_provider: result.messages[0].id }); if (error) throw error; confirmed++;
    }
   }
   return reply({ confirmed, remaining: (deliveries || []).length - confirmed });
  }
  if (outbox.status === 'sent' || outbox.status === 'queued') return reply({ status: outbox.status });
  if (outbox.status === 'unknown') return reply({ error: 'Rapprochez l’envoi avec Gmail avant toute nouvelle tentative.' }, 409);
  const domain = Deno.env.get('BIB_WORKSPACE_DOMAIN'); if (!domain || !/^[a-z0-9.-]+$/i.test(domain)) return reply({ error: 'Configuration Workspace BIB requise.' }, 503);
  const { data: profile } = await admin.from('profiles').select('first_name,last_name,position,email').eq('id', outbox.created_by).single();
  for (const recipient of outbox.recipients as string[]) {
   const recipientHash = (await documentHash(recipient)).slice(0, 24); const dispatchKey = `bib-${outbox.id}-${recipientHash}`;
   const response = await fetch(`${url}/functions/v1/send-transactional-email`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ templateName: outbox.source_message_id ? 'gateway-reply' : 'gateway-outbound', recipientEmail: recipient, idempotencyKey: dispatchKey, gmailThreadId: outbox.gmail_thread_id || undefined, inReplyTo: outbox.in_reply_to || undefined, references: outbox.gmail_references || undefined, templateData: { senderName: '', subject: outbox.subject, message: outbox.body, messageRef: outbox.id.slice(0, 8).toUpperCase(), sentBy: profile?.email || '', sentByName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(), sentByPosition: profile?.position || '', respondedBy: profile?.email || '', respondedByName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(), respondedByPosition: profile?.position || '', intranetOutboxId: outbox.id, rfcMessageId: `<${dispatchKey}@${domain}>` } }) });
   const result = await response.json(); if (!response.ok || result.success !== true || result.queued !== true) return reply({ error: 'La mise en file n’est pas confirmée pour tous les destinataires. Les reprises conservent la même référence.' }, 502);
  }
  const { error: queuedError } = await admin.rpc('mark_intranet_outbox_queued', { p_id: outbox.id }); if (queuedError) throw queuedError;
  const {data:latest,error:latestError}=await caller.rpc('get_intranet_outbox_for_dispatch',{p_id:outbox.id}); if(latestError||!latest)throw latestError;
  return reply({ status: latest.status });
 } catch { return reply({ error: 'La communication n’a pas pu être confirmée. Réessayez sans créer une nouvelle demande.' }, 503); }
});
