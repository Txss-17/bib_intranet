// Point d'entrée pour B.I.B Audit Hub : missions terrain (field_audits) de l'auditeur.
// Auth : secret partagé AUDIT_HUB_MISSIONS_SECRET (en-tête x-linksy-secret) + e-mail de l'auditeur,
// qui doit correspondre à un profil intranet. L'auditeur ne voit/modifie que ses missions.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3'

const headers = { ...corsHeaders, 'Access-Control-Allow-Headers': `${corsHeaders['Access-Control-Allow-Headers']}, x-linksy-secret` }
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

const email = z.string().email().max(255)
const results = {
  score: z.number().int().min(0).max(100),
  findings: z.string().max(5000),
  recommendations: z.string().max(5000),
}
const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list'), auditor_email: email }),
  z.object({ action: z.literal('start'), auditor_email: email, audit_id: z.string().uuid() }),
  z.object({ action: z.literal('sync'), auditor_email: email, audit_id: z.string().uuid(), ...results }),
  z.object({
    action: z.literal('create'), auditor_email: email,
    audit_type: z.string().min(1).max(100), target_type: z.string().min(1).max(50), target_name: z.string().min(1).max(255),
    ...results,
  }),
])

const FIELDS = 'id, mission_reference, audit_type, target_type, target_name, scheduled_date, status, workflow_status, findings, recommendations, score, assigned_at, field_started_at, synced_at, app_origin'

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expected = Deno.env.get('AUDIT_HUB_MISSIONS_SECRET')
  const provided = req.headers.get('x-linksy-secret') ?? ''
  if (!expected || !safeEqual(provided, expected)) return json({ error: 'Unauthorized' }, 401)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const body = parsed.data

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  const { data: prof } = await admin.from('profiles').select('id').ilike('email', body.auditor_email).maybeSingle()
  if (!prof) return json({ error: 'auditor_not_found', message: "Aucun compte intranet avec cette adresse e-mail." }, 404)
  const auditorId = prof.id as string

  const own = async (id: string) => {
    const { data } = await admin.from('field_audits').select('id, workflow_status, auditor_id').eq('id', id).maybeSingle()
    if (!data || data.auditor_id !== auditorId) return null
    return data
  }

  if (body.action === 'list') {
    const { data, error } = await admin.from('field_audits').select(FIELDS)
      .eq('auditor_id', auditorId).in('workflow_status', ['assigned', 'in_field'])
      .order('scheduled_date', { ascending: true, nullsFirst: false })
    if (error) return json({ error: error.message }, 500)
    return json({ missions: data ?? [] })
  }

  if (body.action === 'start') {
    const m = await own(body.audit_id)
    if (!m) return json({ error: 'not_found' }, 404)
    if (m.workflow_status !== 'assigned') return json({ error: 'invalid_status', message: `Mission à l'étape ${m.workflow_status}` }, 409)
    const { data, error } = await admin.from('field_audits')
      .update({ workflow_status: 'in_field', status: 'in_progress', app_origin: 'audit_hub' })
      .eq('id', m.id).select(FIELDS).single()
    if (error) return json({ error: error.message }, 500)
    return json({ mission: data })
  }

  if (body.action === 'sync') {
    const m = await own(body.audit_id)
    if (!m) return json({ error: 'not_found' }, 404)
    if (!['assigned', 'in_field'].includes(m.workflow_status)) return json({ error: 'invalid_status', message: `Mission à l'étape ${m.workflow_status}` }, 409)
    const { data, error } = await admin.from('field_audits').update({
      workflow_status: 'synced', status: 'completed', app_origin: 'audit_hub',
      score: body.score, findings: body.findings, recommendations: body.recommendations,
    }).eq('id', m.id).select(FIELDS).single()
    if (error) return json({ error: error.message }, 500)
    return json({ mission: data })
  }

  // create : audit créé sur le terrain -> passe automatiquement à "synced" (règle intranet)
  const { data, error } = await admin.from('field_audits').insert({
    audit_type: body.audit_type, target_type: body.target_type, target_name: body.target_name,
    auditor_id: auditorId, status: 'completed', app_origin: 'audit_hub', workflow_status: 'mission',
    score: body.score, findings: body.findings, recommendations: body.recommendations,
    scheduled_date: new Date().toISOString().slice(0, 10),
  }).select(FIELDS).single()
  if (error) return json({ error: error.message }, 500)
  return json({ mission: data })
})
