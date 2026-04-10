import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const dbUrl = Deno.env.get('SUPABASE_DB_URL')!
    
    const { Client } = await import('https://deno.land/x/postgres@v0.19.3/mod.ts')
    const client = new Client(dbUrl)
    await client.connect()
    
    await client.queryArray(`
      ALTER TABLE public.products
        ADD COLUMN IF NOT EXISTS selling_price NUMERIC,
        ADD COLUMN IF NOT EXISTS margin NUMERIC,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS product_sheet_url TEXT,
        ADD COLUMN IF NOT EXISTS ingredients TEXT,
        ADD COLUMN IF NOT EXISTS dimensions TEXT,
        ADD COLUMN IF NOT EXISTS weight TEXT,
        ADD COLUMN IF NOT EXISTS barcode TEXT,
        ADD COLUMN IF NOT EXISTS origin TEXT,
        ADD COLUMN IF NOT EXISTS shelf_life TEXT,
        ADD COLUMN IF NOT EXISTS transmitted_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS transmitted_by UUID,
        ADD COLUMN IF NOT EXISTS tech_integration_status TEXT DEFAULT 'not_sent'
    `)
    
    await client.end()

    return new Response(JSON.stringify({ success: true, message: 'Migration applied successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
