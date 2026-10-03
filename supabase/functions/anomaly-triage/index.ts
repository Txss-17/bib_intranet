import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const headers = { ...corsHeaders, 'Access-Control-Expose-Headers': 'X-Lovable-AIG-Run-ID' }
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...headers, 'Content-Type': 'application/json' } })

const MODEL = 'openai/gpt-6-astra'
const SOURCES = ['orders', 'payments', 'stripe', 'invoices', 'stock', 'suppliers', 'audits', 'logistics', 'tech', 'platform']
const SEVERITIES = ['low', 'medium', 'high', 'critical']

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['source', 'category', 'severity', 'title', 'rationale', 'checks'],
  properties: {
    source: { type: 'string', enum: SOURCES },
    category: { type: 'string' },
    severity: { type: 'string', enum: SEVERITIES },
    title: { type: 'string' },
    rationale: { type: 'string' },
    checks: { type: 'array', items: { type: 'string' } },
  },
}

const SYSTEM = `Tu assistes les équipes Ops, Qualité et Finance de Brand in a Box (marketplace) pour trier des anomalies.
À partir de la description, propose : la source (orders, payments, stripe, invoices, stock, suppliers, audits, logistics, tech, platform),
une catégorie courte en français (ex. "Écart de montant", "Retard de livraison", "Non-conformité produit"),
une gravité (low, medium, high, critical), un titre concis (max 80 caractères), une justification brève (max 2 phrases)
et 3 à 6 vérifications concrètes à effectuer, en français. Règles métier : une commande ne mélange jamais plusieurs boutiques ;
Stripe n'est pas la source de vérité commerciale ; rapprocher commande ↔ paiement Stripe ↔ facture ↔ reversement.
Critical = impact financier ou client majeur immédiat. Tu ne décides rien : un humain valide.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return json({ error: 'Unauthorized' }, 401)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: u } = await admin.auth.getUser(token)
  if (!u?.user) return json({ error: 'Unauthorized' }, 401)
  const { data: ok } = await admin.rpc('can_access_anomalies', { _uid: u.user.id })
  if (!ok) return json({ error: 'Accès refusé' }, 403)

  const body = await req.json().catch(() => null)
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 4000) : ''
  const context = typeof body?.context === 'string' ? body.context.trim().slice(0, 500) : ''
  if (description.length < 10) return json({ error: 'Description trop courte' }, 400)

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) return json({ error: 'Lovable AI non configuré' }, 500)

  let res: Response
  try {
    res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      signal: req.signal,
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        store: false,
        reasoning: { effort: 'low', summary: 'auto' },
        include: ['reasoning.encrypted_content'],
        instructions: SYSTEM,
        input: `${context ? `Équipe déclarante : ${context}\n` : ''}Description :\n${description}`,
        text: { format: { type: 'json_schema', name: 'anomaly_triage', strict: true, schema } },
      }),
    })
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499 })
    return json({ error: 'Service IA injoignable' }, 502)
  }

  const runId = res.headers.get('X-Lovable-AIG-Run-ID')
  const extra = runId ? { 'X-Lovable-AIG-Run-ID': runId } : {}
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => '')
    let msg = 'Erreur du service IA'
    try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? msg } catch { /* ignore */ }
    if (res.status === 402) msg = 'Crédits IA insuffisants. Ajoutez des crédits dans Paramètres → Plans & crédits.'
    if (res.status === 429) msg = 'Trop de demandes, réessayez dans un instant.'
    return new Response(JSON.stringify({ error: msg }), { status: res.status, headers: { ...headers, ...extra, 'Content-Type': 'application/json' } })
  }

  // Lecture du flux SSE
  const reader = res.body.getReader()
  const dec = new TextDecoder()
  let buf = '', text = '', streamErr: string | null = null, refusal = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      const d = line.slice(5).trim()
      if (!d || d === '[DONE]') continue
      try {
        const ev = JSON.parse(d)
        if (ev.type === 'response.output_text.delta') text += ev.delta ?? ''
        else if (ev.type === 'response.refusal.delta') refusal += ev.delta ?? ''
        else if (ev.type === 'error' || ev.type === 'response.failed') streamErr = ev.error?.message ?? ev.response?.error?.message ?? 'Erreur IA'
      } catch { /* ignore */ }
    }
  }
  if (streamErr) return json({ error: streamErr }, 502)
  if (refusal || !text) return json({ error: refusal ? 'Le modèle a refusé cette demande.' : 'Réponse vide du modèle.' }, 422)

  try {
    const s = JSON.parse(text)
    const out = {
      source: SOURCES.includes(s.source) ? s.source : 'orders',
      category: String(s.category ?? '').slice(0, 80),
      severity: SEVERITIES.includes(s.severity) ? s.severity : 'medium',
      title: String(s.title ?? '').slice(0, 120),
      rationale: String(s.rationale ?? '').slice(0, 600),
      checks: (Array.isArray(s.checks) ? s.checks : []).slice(0, 8).map((c: unknown) => String(c).slice(0, 200)),
      model: MODEL,
      generated_at: new Date().toISOString(),
    }
    return new Response(JSON.stringify(out), { headers: { ...headers, ...extra, 'Content-Type': 'application/json' } })
  } catch {
    return json({ error: 'Réponse IA illisible' }, 502)
  }
})
