import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linksy-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TARGETS = [
  {
    email: 'tgliyeta@gmail.com',
    password: 'TXss@s17',
    first_name: 'Admin',
    last_name: 'Test',
    position: 'supplier_logistics_manager',
    poles: ['supplier', 'ops'],
    seniority: 'collaborator',
  },
]

const DOC = {
  name: 'Modèle emballage Brand-in-a-Box — Vision globale',
  type: 'template',
  pole_id: 'ops',
  version: '1.0',
  status: 'approved',
  access_level: 'restricted',
  file_url: 'https://cxguhlssztinaxrgeuku.supabase.co/storage/v1/object/public/product-assets/documents%2Fmodele-emballage-bib.png',
  modified_by: 'System',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const expected = Deno.env.get('LINKSY_API_SECRET_KEY')
  const provided = req.headers.get('x-linksy-key')
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const results: any[] = []

  for (const t of TARGETS) {
    // Find or create user
    let userId: string | null = null
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = list?.users?.find(u => u.email?.toLowerCase() === t.email.toLowerCase())
    if (existing) {
      userId = existing.id
      // Reset password
      await supabase.auth.admin.updateUserById(userId, { password: t.password, email_confirm: true })
    } else {
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email: t.email,
        password: t.password,
        email_confirm: true,
        user_metadata: { first_name: t.first_name, last_name: t.last_name },
      })
      if (cErr) {
        results.push({ email: t.email, error: cErr.message })
        continue
      }
      userId = created.user!.id
    }

    // Upsert profile
    const { error: pErr } = await supabase.from('profiles').upsert({
      id: userId,
      email: t.email,
      first_name: t.first_name,
      last_name: t.last_name,
      position: t.position,
      poles: t.poles,
      seniority: t.seniority,
    } as any, { onConflict: 'id' })

    // Ensure manager role
    await supabase.from('user_roles').upsert({ user_id: userId, role: 'manager' } as any, { onConflict: 'user_id,role' })

    results.push({ email: t.email, userId, profileError: pErr?.message })
  }

  // Insert document if not present
  const { data: existingDoc } = await supabase.from('documents')
    .select('id').eq('name', DOC.name).maybeSingle()
  let docId = existingDoc?.id
  if (!docId) {
    const { data: ins, error: dErr } = await supabase.from('documents').insert(DOC as any).select('id').single()
    docId = ins?.id
    if (dErr) results.push({ docError: dErr.message })
  }

  return new Response(JSON.stringify({ ok: true, results, document_id: docId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
