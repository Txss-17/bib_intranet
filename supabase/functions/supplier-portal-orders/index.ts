import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linksy-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Shared secret — BOS portal proxies the request with the shared key + supplier_id
  const expected = Deno.env.get('LINKSY_API_SECRET_KEY')
  const provided = req.headers.get('x-linksy-key')
  if (!expected || provided !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const supplierId = url.searchParams.get('supplier_id')
  if (!supplierId || !/^[0-9a-f-]{36}$/i.test(supplierId)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid supplier_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const [ordersRes, notifsRes] = await Promise.all([
    supabase.from('supplier_restock_orders')
      .select('id, product_name, quantity, destination_type, destination_name, customization_notes, status, priority, due_date, sent_at, acknowledged_at, created_at')
      .eq('supplier_id', supplierId)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('supplier_portal_notifications')
      .select('id, type, title, body, reference_table, reference_id, read_at, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return new Response(JSON.stringify({
    orders: ordersRes.data ?? [],
    notifications: notifsRes.data ?? [],
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
