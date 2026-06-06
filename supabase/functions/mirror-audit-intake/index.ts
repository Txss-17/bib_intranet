// Mirror Audit Intake — receives finalized audit reports from B.I.B Audit Hub
// and inserts them into the correct Connect table with app_origin='audit_hub'.
//
// Auth: shared secret LINKSY_API_SECRET_KEY via `x-linksy-secret` header.
// No service_role key exposure to the Hub project.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-linksy-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TargetKind = "ops" | "supplier" | "field";

interface MirrorPayload {
  target_kind: TargetKind;
  // Common fields
  auditor: string;
  date: string; // ISO date
  status: string; // 'scheduled' | 'in_progress' | 'completed'
  score?: number | null;
  notes?: string | null;
  // Ops-specific
  process?: string;
  scope?: string;
  recommendations?: number | null;
  findings?: string | number | null;
  // Supplier-specific
  supplier?: string;
  category?: string;
  // Hub traceability
  hub_mission_id?: string;
  hub_report_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // --- Auth: shared secret ---
  const expected = Deno.env.get("LINKSY_API_SECRET_KEY");
  const provided = req.headers.get("x-linksy-secret");
  if (!expected || !provided || provided !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: MirrorPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { target_kind, auditor, date, status } = payload;
  if (!target_kind || !["ops", "supplier", "field"].includes(target_kind)) {
    return new Response(
      JSON.stringify({ error: "target_kind must be 'ops' | 'supplier' | 'field'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (!auditor || !date || !status) {
    return new Response(
      JSON.stringify({ error: "auditor, date, status are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // --- Supabase admin client (service role lives only on this project) ---
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // --- Route to correct table ---
  let table = "";
  let row: Record<string, unknown> = {
    auditor,
    date,
    status,
    score: payload.score ?? null,
    notes: payload.notes ?? null,
    app_origin: "audit_hub",
  };

  if (target_kind === "ops" || target_kind === "field") {
    table = target_kind === "ops" ? "ops_audits" : "field_audits";
    row = {
      ...row,
      process: payload.process ?? "Audit Hub mission",
      scope: payload.scope ?? "",
      recommendations: payload.recommendations ?? null,
      findings: typeof payload.findings === "number" ? String(payload.findings) : payload.findings ?? null,
    };
  } else {
    table = "supplier_audits";
    row = {
      ...row,
      supplier: payload.supplier ?? "Unknown supplier",
      category: payload.category ?? "general",
      findings: typeof payload.findings === "string" ? Number(payload.findings) || 0 : payload.findings ?? 0,
    };
  }

  // Hub traceability inside notes if not already present
  if (payload.hub_mission_id || payload.hub_report_id) {
    const trace = `[Hub mission=${payload.hub_mission_id ?? "?"} report=${payload.hub_report_id ?? "?"}]`;
    row.notes = row.notes ? `${row.notes}\n${trace}` : trace;
  }

  const { data, error } = await supabase.from(table).insert(row).select().single();

  if (error) {
    console.error("Insert failed", { table, error });
    return new Response(
      JSON.stringify({ error: error.message, table }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, table, id: (data as any)?.id }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
