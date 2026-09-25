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
  // Notifications routées vers le pôle concerné (une par nouvel élément)
  const notes: Record<string, unknown>[] = []
  const notify = (pole_id: string, title: string, message: string, action_url: string, type = 'info') =>
    notes.push({ pole_id, title, message, action_url, type })

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
        else {
          shopMap.set(b.id, res.data.id); count++
          if (!ex) {
            notify('ops', 'Nouvelle boutique à examiner', b.name, '/pole/ops/shops')
            notify('lifecycle', 'Nouvelle boutique sur la plateforme', b.name, '/pole/ops/shops')
          }
        }
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
        else { count++; if (!ex) notify('lifecycle', `Nouveau ticket plateforme`, row.subject, '/pole/lifecycle/support', row.priority === 'high' ? 'warning' : 'info') }
      }

      // Candidatures fournisseurs -> pôle Fournisseurs
      for (const a of data.supplier_applications ?? []) {
        const row = {
          platform_id: a.id, name: a.company_name ?? a.name ?? 'Candidature fournisseur',
          contact_name: a.contact_name ?? null, contact_email: a.contact_email ?? a.email ?? null,
          email: a.contact_email ?? a.email ?? null, phone: a.contact_phone ?? a.phone ?? null,
          country: a.country ?? null, notes: a.message ?? a.description ?? null, platform_synced_at: now,
        }
        const { data: ex } = await admin.from('suppliers').select('id').eq('platform_id', a.id).maybeSingle()
        const res = ex
          ? await admin.from('suppliers').update(row).eq('id', ex.id)
          : await admin.from('suppliers').insert({ ...row, status: 'pending', audit_status: 'pending' })
        if (res.error) errors.push(`candidature ${row.name}: ${res.error.message}`)
        else { count++; if (!ex) notify('supplier', 'Nouvelle candidature fournisseur', `${row.name}${row.country ? ' — ' + row.country : ''}`, '/pole/supplier/pending') }
      }

      // Nouveaux comptes marchands -> pôle Lifecycle
      for (const m of data.merchants ?? []) {
        const row = {
          platform_id: m.id, company_name: m.company_name ?? m.business_name ?? m.full_name ?? m.email ?? 'Marchand',
          contact_name: m.full_name ?? m.contact_name ?? null, contact_email: m.email ?? 'inconnu@platform',
          subscription_status: m.subscription_status ?? null, platform_synced_at: now,
        }
        const { data: ex } = await admin.from('user_accounts').select('id').eq('platform_id', m.id).maybeSingle()
        const res = ex
          ? await admin.from('user_accounts').update(row).eq('id', ex.id)
          : await admin.from('user_accounts').insert(row)
        if (res.error) errors.push(`marchand ${row.company_name}: ${res.error.message}`)
        else { count++; if (!ex) notify('lifecycle', 'Nouveau compte marchand', row.company_name, '/pole/lifecycle/user-accounts') }
      }

      // Flux financiers -> pôle Finance (cashflows, source 'platform')
      // Plateforme = source des événements ; l'intranet reste la référence d'analyse.
      if (!shopMap.size) {
        const { data: known } = await admin.from('shops').select('id, platform_id').not('platform_id', 'is', null)
        for (const s of known ?? []) shopMap.set(s.platform_id as string, s.id)
      }
      const FIN: Array<[string, string, 'income' | 'expense', string]> = [
        ['subscriptions', 'subscription', 'income', 'Abonnement'],
        ['commissions', 'commission', 'income', 'Commission'],
        ['payments', 'sale', 'income', 'Paiement'],
        ['fees', 'payment_fee', 'expense', 'Frais de paiement'],
        ['refunds', 'refund', 'expense', 'Remboursement'],
        ['payouts', 'merchant_payout', 'expense', 'Reversement marchand'],
      ]
      for (const [key, category, type, label] of FIN) {
        for (const f of (data[key] ?? []) as any[]) {
          const amount = Math.abs(Number(f.amount ?? 0))
          if (!f.id || !amount) continue
          const row = {
            platform_id: `${category}:${f.id}`, type, category, amount,
            currency: (f.currency ?? 'EUR').toUpperCase(),
            description: f.description ?? `${label}${f.plan ? ' — ' + f.plan : ''}`,
            reference: f.stripe_id ?? f.payment_intent ?? f.order_number ?? f.reference ?? null,
            transaction_date: String(f.date ?? f.created_at ?? now).slice(0, 10),
            shop_id: f.boutique_id ? shopMap.get(f.boutique_id) ?? null : null,
            source: 'platform', platform_synced_at: now,
          }
          const { error } = await admin.from('cashflows').upsert(row, { onConflict: 'platform_id' })
          if (error) errors.push(`${label} ${f.id}: ${error.message}`)
          else count++
        }
      }
      const finCount = FIN.reduce((n, [k]) => n + ((data[k] ?? []) as any[]).length, 0)
      if (finCount) notify('finance', 'Flux financiers synchronisés', `${finCount} opérations depuis B.I.B Platform`, '/pole/finance')

      if (notes.length) {
        const { error: nErr } = await admin.from('notifications').insert(notes)
        if (nErr) errors.push(`notifications: ${nErr.message}`)
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
    if (errors.length) {
      await admin.from('anomalies').insert({
        source: 'platform', type: 'Synchronisation partielle', severity: errors.length > 5 ? 'high' : 'medium',
        title: `Synchronisation B.I.B Platform : ${errors.length} rejet(s)`, description: errors.slice(0, 20).join('\n'),
        object_type: 'platform_sync_run', object_id: run!.id, created_by: uid,
      })
    }
    return json({ success: true, items: count, errors })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await admin.from('platform_sync_runs').update({
      status: 'error', items_count: count, errors: [...errors, msg], finished_at: new Date().toISOString(),
    }).eq('id', run!.id)
    return json({ error: msg }, 502)
  }
})
