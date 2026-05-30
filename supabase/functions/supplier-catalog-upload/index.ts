import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linksy-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PayloadSchema = z.object({
  supplier_id: z.string().uuid(),
  submitted_by_email: z.string().email().max(255).optional(),
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.string().trim().max(120).default('application/octet-stream'),
  file_base64: z.string().min(1), // bare base64, no data: prefix
  version: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(2000).optional(),
})

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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
  const p = parsed.data

  const bytes = b64ToBytes(p.file_base64)
  // Hard cap 25 MB to avoid abuse
  if (bytes.byteLength > 25 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: 'File too large (max 25 MB)' }), {
      status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const objectId = crypto.randomUUID()
  const safeName = p.file_name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const objectPath = `catalogs/${p.supplier_id}/${objectId}-${safeName}`

  const { error: upErr } = await supabase.storage
    .from('product-assets')
    .upload(objectPath, bytes, { contentType: p.mime_type, upsert: false })

  if (upErr) {
    console.error('upload failed', upErr)
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: pub } = supabase.storage.from('product-assets').getPublicUrl(objectPath)
  const fileUrl = pub.publicUrl

  const { data: inserted, error: insErr } = await supabase
    .from('supplier_catalog_uploads')
    .insert({
      supplier_id: p.supplier_id,
      submitted_by_email: p.submitted_by_email ?? null,
      file_name: p.file_name,
      file_url: fileUrl,
      file_size: bytes.byteLength,
      mime_type: p.mime_type,
      version: p.version ?? null,
      notes: p.notes ?? null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insErr) {
    console.error('insert failed', insErr)
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Notify any supplier_manager (least-loaded approach skipped — broadcast)
  const { data: managers } = await supabase
    .from('profiles').select('id').eq('position', 'supplier_manager')
  if (managers && managers.length > 0) {
    const notifs = managers.map((m: any) => ({
      user_id: m.id,
      title: 'Nouveau catalogue fournisseur',
      message: `Catalogue uploadé : ${p.file_name}${p.version ? ` (v${p.version})` : ''}`,
      type: 'info',
      pole_id: 'supplier',
      action_url: `/pole/supplier/catalog-inbox`,
    }))
    await supabase.from('notifications').insert(notifs)
  }

  return new Response(JSON.stringify({ success: true, id: inserted.id, file_url: fileUrl }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
