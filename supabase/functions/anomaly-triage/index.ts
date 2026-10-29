import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
// Classification and decisions are performed manually inside the intranet.
Deno.serve(request => request.method === 'OPTIONS' ? new Response(null, { headers: corsHeaders }) : new Response(JSON.stringify({ error: 'La qualification des anomalies est réalisée manuellement dans le registre.' }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }));
