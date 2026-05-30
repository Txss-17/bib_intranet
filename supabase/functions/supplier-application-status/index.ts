import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-linksy-key',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const PUBLIC_EVENT_FIELDS = ['event_type', 'to_status', 'notes', 'created_at']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid token' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: app, error } = await supabase
    .from('supplier_applications')
    .select('id, company_name, type, status, priority, blocking_criteria, created_at, updated_at, assigned_to_name, decision_at')
    .eq('public_token', token)
    .maybeSingle()

  if (error || !app) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: events } = await supabase
    .from('supplier_application_events')
    .select(PUBLIC_EVENT_FIELDS.join(','))
    .eq('application_id', app.id)
    .order('created_at', { ascending: true })

  return new Response(JSON.stringify({
    application: {
      id: app.id,
      company_name: app.company_name,
      type: app.type,
      status: app.status,
      priority: app.priority,
      blocking_criteria: app.blocking_criteria ?? [],
      assigned_to_name: app.assigned_to_name,
      decision_at: app.decision_at,
      created_at: app.created_at,
      updated_at: app.updated_at,
    },
    timeline: events ?? [],
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
