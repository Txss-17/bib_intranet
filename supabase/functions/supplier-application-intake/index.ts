import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linksy-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PayloadSchema = z.object({
  type: z.enum(['supplier', 'manufacturer', 'logistics']).default('supplier'),
  company_name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().max(200).optional(),
  contact_email: z.string().trim().email().max(255),
  contact_phone: z.string().trim().max(50).optional(),
  country: z.string().trim().max(80).optional(),
  category: z.string().trim().max(120).optional(),
  lead_time_days: z.number().int().min(0).max(365).optional(),
  moq: z.number().int().min(0).optional(),
  audit_accepted: z.boolean().default(false),
  certifications: z.array(z.any()).optional().default([]),
  documents: z.array(z.any()).optional().default([]),
  extra: z.record(z.any()).optional().default({}),
})

type Payload = z.infer<typeof PayloadSchema>

function computeScoreAndPriority(p: Payload) {
  const blocking: string[] = []
  let score = 0
  // Lead time
  if (p.lead_time_days !== undefined) {
    if (p.lead_time_days < 5) score += 20
    else if (p.lead_time_days <= 10) score += 10
  }
  // MOQ
  if (p.moq !== undefined) {
    if (p.moq < 50) score += 15
    else if (p.moq <= 200) score += 10
    else score += 2
  }
  // Audit
  if (p.audit_accepted) score += 20
  else blocking.push('audit_refused')
  // Certifications
  const certCount = Array.isArray(p.certifications) ? p.certifications.length : 0
  score += Math.min(certCount * 5, 15)
  // Country
  const c = (p.country || '').toUpperCase()
  if (c === 'FR' || c === 'FRANCE') score += 10
  else if (['DE','ES','IT','BE','NL','PT','PL','AT','IE','LU','DK','SE','FI','GR','CZ','RO','HU','BG','SK','HR','SI','EE','LV','LT','CY','MT'].includes(c)) score += 5

  const euOrFr = c === 'FR' || c === 'FRANCE' || ['DE','ES','IT','BE','NL','PT'].includes(c)
  let priority: 'high' | 'standard' | 'low'
  if (score >= 55 && euOrFr && p.audit_accepted) priority = 'high'
  else if (score >= 30) priority = 'standard'
  else priority = 'low'

  return { score, priority, blocking }
}

async function autoAssign(supabase: any, category: string | undefined) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, position')
    .or('position.eq.supplier_manager,position.eq.ceo')
  const candidates = (profiles || []).filter((p: any) => p.position !== 'ceo')
  if (candidates.length === 0) return null

  const { data: assigns } = await supabase
    .from('supplier_applications')
    .select('assigned_to_id')
    .in('status', ['assigned','in_review'])
  const counts: Record<string, number> = {}
  ;(assigns || []).forEach((a: any) => {
    if (a.assigned_to_id) counts[a.assigned_to_id] = (counts[a.assigned_to_id] || 0) + 1
  })

  // pick least loaded
  candidates.sort((a: any, b: any) => (counts[a.id] || 0) - (counts[b.id] || 0))
  const chosen = candidates[0]
  return { id: chosen.id, name: `${chosen.first_name} ${chosen.last_name}`.trim() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Shared-secret auth for BOS → Connect
  const expected = Deno.env.get('LINKSY_API_SECRET_KEY')
  const provided = req.headers.get('x-linksy-key')
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let raw: unknown
  try { raw = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const parsed = PayloadSchema.safeParse(raw)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const payload = parsed.data

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { score, priority, blocking } = computeScoreAndPriority(payload)
  const autoRejected = !payload.audit_accepted

  let assigned: { id: string; name: string } | null = null
  if (!autoRejected) {
    try { assigned = await autoAssign(supabase, payload.category) } catch (e) { console.warn('assign failed', e) }
  }

  const status = autoRejected ? 'rejected' : (assigned ? 'assigned' : 'new')

  const { data: inserted, error: insErr } = await supabase
    .from('supplier_applications')
    .insert({
      type: payload.type,
      company_name: payload.company_name,
      contact_name: payload.contact_name ?? null,
      contact_email: payload.contact_email,
      contact_phone: payload.contact_phone ?? null,
      country: payload.country ?? null,
      category: payload.category ?? null,
      lead_time_days: payload.lead_time_days ?? null,
      moq: payload.moq ?? null,
      audit_accepted: payload.audit_accepted,
      certifications: payload.certifications,
      documents: payload.documents,
      raw_payload: payload.extra ?? {},
      score,
      priority,
      status,
      blocking_criteria: blocking,
      assigned_to_id: assigned?.id ?? null,
      assigned_to_name: assigned?.name ?? null,
      assigned_at: assigned ? new Date().toISOString() : null,
      source: 'bos_form',
    })
    .select('id')
    .single()

  if (insErr) {
    console.error('insert failed', insErr)
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Events history
  const events = [
    { application_id: inserted.id, event_type: 'created', to_status: status, metadata: { source: 'bos_form' } },
    { application_id: inserted.id, event_type: 'scored', notes: `score=${score} priority=${priority}`, metadata: { score, priority, blocking } },
  ]
  if (assigned) {
    events.push({
      application_id: inserted.id,
      event_type: 'assigned',
      to_status: 'assigned',
      notes: `Auto-assigné à ${assigned.name}`,
      metadata: { assigned_to_id: assigned.id, assigned_to_name: assigned.name },
    } as any)
  }
  await supabase.from('supplier_application_events').insert(events)

  // Notify assignee
  if (assigned) {
    await supabase.from('notifications').insert({
      user_id: assigned.id,
      title: 'Nouvelle candidature fournisseur',
      message: `${payload.company_name} — score ${score} (${priority})`,
      type: 'info',
      pole_id: 'supplier',
      action_url: `/pole/supplier/applications/${inserted.id}`,
    })
  }

  return new Response(JSON.stringify({
    success: true, id: inserted.id, score, priority, status, assigned_to: assigned,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
