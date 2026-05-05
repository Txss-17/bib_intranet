import { createClient } from 'npm:@supabase/supabase-js@2'

// Public webhook for inbound messages from any external source
// (form submission, email forwarding service, third-party connector).
// Inserts into external_messages and triggers the standard gateway flow.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Server config error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const sender_email = (body.sender_email || body.from || '').trim().toLowerCase()
  const sender_name = body.sender_name || body.fromName || null
  const subject = (body.subject || '').trim()
  const content = (body.content || body.text || body.html || '').trim()

  if (!sender_email || !subject || !content) {
    return new Response(JSON.stringify({ error: 'sender_email, subject, content required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data, error } = await supabase
    .from('external_messages')
    .insert({ sender_email, sender_name, subject, content, status: 'pending' })
    .select('id')
    .single()

  if (error) {
    console.error('Insert failed', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Auto-acknowledge to the sender
  try {
    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'gateway-acknowledgment',
        recipientEmail: sender_email,
        templateData: { senderName: sender_name || '', subject, messageRef: data.id.slice(0, 8).toUpperCase() },
      },
    })
  } catch (e) {
    console.warn('Ack email failed (non-fatal)', e)
  }

  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
