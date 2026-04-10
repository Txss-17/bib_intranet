import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: `
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
          ADD COLUMN IF NOT EXISTS tech_integration_status TEXT DEFAULT 'not_sent';
      `
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
