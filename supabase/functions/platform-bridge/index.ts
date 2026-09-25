import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const Body = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status') }),
  z.object({ action: z.literal('pull'), since: z.string().datetime().optional() }),
  z.object({ action: z.literal('push_product'), product_id: z.string().uuid() }),
  z.object({ action: z.literal('push_shop_status'), shop_id: z.string().uuid() }),
])

// Mapping plateforme -> intranet des statuts boutique
const SHOP_STATUS: Record<string, string> = {
  draft: 'application', pending: 'review', review: 'review', test: 'test', trial: 'test',
  active: 'active', published: 'active', suspended: 'suspended', closed: 'closed', archived: 'closed',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // Auth : utilisateur connecté avec rôle Tech / Admin / Direction (ou Ops pour push)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  const { data: u, error: uErr } = await admin.auth.getUser(token)
  if (uErr || !u.user) return json({ error: 'Unauthorized' }, 401)
  const uid = u.user.id
  const [{ data: lead }, { data: prof }] = await Promise.all([
    admin.rpc('is_leadership', { _user_id: uid }),
    admin.from('profiles').select('poles').eq('id', uid).maybeSingle(),
  ])
  const poles: string[] = (prof?.poles as string[]) ?? []

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const body = parsed.data

  const allowed = body.action === 'pull'
    ? lead || poles.includes('tech')
    : lead || poles.some((p) => ['tech', 'ops', 'supplier', 'lifecycle'].includes(p))
  if (!allowed) return json({ error: 'Forbidden' }, 403)

  const base = Deno.env.get('BIB_PLATFORM_FUNCTIONS_URL')
  const secret = Deno.env.get('BIB_PLATFORM_BRIDGE_SECRET')
  const configured = !!base && !!secret
  if (body.action === 'status') return json({ configured })
  if (!configured) return json({ error: 'Liaison B.I.B Platform non configurée' }, 412)

  const call = async (fn: string, payload: unknown) => {
    const r = await fetch(`${base!.replace(/\/$/, '')}/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-bib-bridge-key': secret! },
      body: JSON.stringify(payload),
    })
    const t = await r.text()
    if (!r.ok) throw new Error(`${fn} ${r.status}: ${t.slice(0, 300)}`)
    return JSON.parse(t)
  }

  const { data: run } = await admin.from('platform_sync_runs')
    .insert({ direction: body.action === 'pull' ? 'pull' : 'push', action: body.action, triggered_by: uid })
    .select('id').single()
  const errors: string[] = []
  let count = 0
  const now = new Date().toISOString()

  try {
    if (body.action === 'pull') {
      const data = await call('intranet-export', { since: body.since ?? null })
      const shopMap = new Map<string, string>()

      for (const b of data.boutiques ?? []) {
        const row = {
          platform_id: b.id, name: b.name, slug: b.slug,
          merchant_name: b.legal_business_name ?? null, merchant_email: b.legal_email ?? null,
          merchant_phone: b.legal_phone ?? null, category: b.category ?? null,
          subscription_plan: b.subscription_plan ?? null,
          status: SHOP_STATUS[b.status] ?? 'review', platform_synced_at: now, app_origin: 'bos',
        }
        const { data: ex } = await admin.from('shops').select('id').eq('platform_id', b.id).maybeSingle()
        const res = ex
          ? await admin.from('shops').update(row).eq('id', ex.id).select('id').single()
          : await admin.from('shops').insert({ ...row, shop_code: `BOS-${String(b.id).slice(0, 8).toUpperCase()}` }).select('id').single()
        if (res.error) errors.push(`boutique ${b.name}: ${res.error.message}`)
        else { shopMap.set(b.id, res.data.id); count++ }
      }
      if ((data.orders ?? []).length) {
        const { data: known } = await admin.from('shops').select('id, platform_id').not('platform_id', 'is', null)
        for (const s of known ?? []) shopMap.set(s.platform_id as string, s.id)
      }
      for (const o of data.orders ?? []) {
        const shopId = shopMap.get(o.boutique_id)
        if (!shopId) { errors.push(`commande ${o.order_number}: boutique inconnue`); continue }
        const row = {
          platform_id: o.id, order_number: o.order_number ?? `BOS-${String(o.id).slice(0, 8)}`,
          shop_id: shopId, total_amount: o.amount ?? 0, status: o.payment_status === 'paid' ? (o.logistics_status ?? 'paid') : (o.payment_status ?? 'pending'),
          current_stage: o.logistics_status ?? null, region: o.market ?? null, platform_synced_at: now,
        }
        const { data: ex } = await admin.from('orders').select('id').eq('platform_id', o.id).maybeSingle()
        const { shop_id, ...upd } = row
        const res = ex
          ? await admin.from('orders').update(upd).eq('id', ex.id)
          : await admin.from('orders').insert(row)
        if (res.error) errors.push(`commande ${row.order_number}: ${res.error.message}`)
        else count++
      }
      for (const t of data.tickets ?? []) {
        const row = {
          platform_id: t.id, subject: t.subject ?? 'Ticket plateforme', description: t.message ?? t.description ?? null,
          status: t.status ?? 'open', priority: t.priority ?? 'medium', platform_synced_at: now,
        }
        const { data: ex } = await admin.from('support_tickets').select('id').eq('platform_id', t.id).maybeSingle()
        const res = ex
          ? await admin.from('support_tickets').update(row).eq('id', ex.id)
          : await admin.from('support_tickets').insert(row)
        if (res.error) errors.push(`ticket: ${res.error.message}`)
        else count++
      }
    }

    if (body.action === 'push_product') {
      const { data: p, error } = await admin.from('products').select('*').eq('id', body.product_id).single()
      if (error || !p) throw new Error('Produit introuvable')
      if (!['validated', 'approved', 'active'].includes(String(p.status))) throw new Error('Seuls les produits validés peuvent être publiés')
      // Uniquement les champs publics — jamais coûts internes, notes ou audits fournisseur
      const res = await call('intranet-import', {
        type: 'supplier_product',
        data: {
          intranet_id: p.id, platform_id: p.platform_id ?? null, name: p.name, description: p.description ?? null,
          category: p.category ?? null, base_price: p.selling_price ?? null, moq: p.moq ?? null,
          max_margin_percent: p.margin ?? null, image_url: p.image_url ?? null, market: p.origin ?? null, is_active: true,
        },
      })
      await admin.from('products').update({ platform_id: res.id ?? p.platform_id, platform_synced_at: now, platform_publish_status: 'published' }).eq('id', p.id)
      count = 1
    }

    if (body.action === 'push_shop_status') {
      const { data: s } = await admin.from('shops').select('id, platform_id, status').eq('id', body.shop_id).single()
      if (!s?.platform_id) throw new Error('Boutique non liée à la plateforme')
      await call('intranet-import', { type: 'boutique_status', data: { platform_id: s.platform_id, status: s.status } })
      await admin.from('shops').update({ platform_synced_at: now }).eq('id', s.id)
      count = 1
    }

    await admin.from('platform_sync_runs').update({
      status: errors.length ? 'partial' : 'success', items_count: count, errors, finished_at: new Date().toISOString(),
    }).eq('id', run!.id)
    return json({ success: true, items: count, errors })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin.from('platform_sync_runs').update({
      status: 'error', items_count: count, errors: [...errors, msg], finished_at: new Date().toISOString(),
    }).eq('id', run!.id)
    return json({ error: msg }, 502)
  }
})
