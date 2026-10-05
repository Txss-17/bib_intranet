import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * BIB Gateway — réception des messages entrants
 *
 * Cette fonction est appelée par un fournisseur externe
 * (email forwarding, formulaire, connecteur, etc.).
 *
 * L'endpoint Supabase est public car le fournisseur externe
 * ne possède pas de session BIB.
 *
 * La protection est assurée par GATEWAY_INBOUND_SECRET.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-gateway-secret',
}

const json = (
  body: Record<string, unknown>,
  status = 200,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
  }

  if (req.method !== 'POST') {
    return json(
      {
        error: 'Method not allowed',
      },
      405,
    )
  }

  const supabaseUrl =
    Deno.env.get('SUPABASE_URL')

  const supabaseServiceKey =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  const gatewaySecret =
    Deno.env.get('GATEWAY_INBOUND_SECRET')

  if (
    !supabaseUrl ||
    !supabaseServiceKey ||
    !gatewaySecret
  ) {
    console.error(
      '[gateway-inbound-email] Missing server configuration',
    )

    return json(
      {
        error: 'Server configuration error',
      },
      500,
    )
  }

  /**
   * Le fournisseur externe doit transmettre :
   *
   * X-Gateway-Secret: <secret>
   *
   * Aucun secret n'est accepté dans le body ou l'URL.
   */
  const providedSecret =
    req.headers.get('x-gateway-secret')

  if (
    !providedSecret ||
    providedSecret !== gatewaySecret
  ) {
    console.warn(
      '[gateway-inbound-email] Unauthorized webhook request',
    )

    return json(
      {
        error: 'Unauthorized',
      },
      401,
    )
  }

  let body: any

  try {
    body = await req.json()
  } catch {
    return json(
      {
        error: 'Invalid JSON',
      },
      400,
    )
  }

  const sender_email = (
    body.sender_email ||
    body.from ||
    ''
  )
    .trim()
    .toLowerCase()

  const sender_name =
    body.sender_name ||
    body.fromName ||
    null

  const subject =
    (
      body.subject ||
      ''
    ).trim()

  const content =
    (
      body.content ||
      body.text ||
      body.html ||
      ''
    ).trim()

  if (
    !sender_email ||
    !subject ||
    !content
  ) {
    return json(
      {
        error:
          'sender_email, subject, content required',
      },
      400,
    )
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey,
  )

  /**
   * Création du message.
   *
   * Important :
   * - pending = reçu
   * - routed_to_pole reste NULL
   *
   * Le message est donc immédiatement disponible
   * dans Gateway / Boîte de réception.
   */
  const {
    data,
    error,
  } = await supabase
    .from('external_messages')
    .insert({
      sender_email,
      sender_name,
      subject,
      content,
      status: 'pending',
      routed_to_pole: null,
    })
    .select('id')
    .single()

  if (error) {
    console.error(
      '[gateway-inbound-email] Insert failed',
      error,
    )

    return json(
      {
        error: error.message,
      },
      500,
    )
  }

  /**
   * Accusé de réception automatique.
   *
   * Cet email ne constitue PAS une réponse métier.
   * Il confirme uniquement la bonne réception du message.
   */
  try {
    const {
      error: ackError,
    } = await supabase.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName:
            'gateway-acknowledgment',
          recipientEmail:
            sender_email,
          templateData: {
            senderName:
              sender_name || '',
            subject,
            messageRef:
              data.id
                .slice(0, 8)
                .toUpperCase(),
          },
        },
      },
    )

    if (ackError) {
      console.warn(
        '[gateway-inbound-email] Ack email failed',
        ackError,
      )
    }
  } catch (error) {
    console.warn(
      '[gateway-inbound-email] Ack email exception',
      error,
    )
  }

  return json({
    success: true,
    id: data.id,
  })
})
